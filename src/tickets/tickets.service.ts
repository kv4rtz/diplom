import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { CreateOptions, Op, Sequelize, WhereOptions } from 'sequelize';
import { ChatsService } from 'src/chats/chats.service';
import { ErrorCause } from 'src/errors-couse';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { parseOrderBy } from 'src/global/utils/parseOrderBy';
import {
  MessageType,
  TicketStatus,
  TicketTopic,
  TicketTopicCategory,
} from 'src/graphql';
import { MessagesService } from 'src/messages/messages.service';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { UsersService } from 'src/users/users.service';
import {
  TicketMessage,
  TicketMessageCreationAttrs,
} from './models/ticket-messages.model';
import { Ticket, TicketCreationAttrs } from './models/tickets.model';

@Injectable()
export class TicketsService {
  constructor(
    @InjectConnection() private readonly connection: Sequelize,
    @InjectModel(Ticket) private readonly ticketsRepository: typeof Ticket,
    @InjectModel(TicketMessage)
    private readonly ticketsMessageRepository: typeof TicketMessage,
    private readonly storageService: StorageService,
    private readonly usersService: UsersService,
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
  ) {}

  async getAllTicketsWithPagination(options: {
    pageInfo: PageInfoDto;
    authorId?: number;
    status?: TicketStatus;
    topic?: TicketTopic;
    topicCategory?: TicketTopicCategory;
    order?: string;
  }) {
    const { page = 1, limit = 20 } = options.pageInfo;
    const offset = (page - 1) * limit;

    const where: WhereOptions<Ticket> = {};
    if (options.authorId) where.authorId = options.authorId;
    if (options.status) where.status = options.status;
    if (options.topic) where.topic = options.topic;
    if (options.topicCategory) where.topicCategory = options.topicCategory;

    const { count, rows } = await this.ticketsRepository.findAndCountAll({
      distinct: true,
      where,
      order: options.order
        ? [parseOrderBy(options.order)]
        : [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      pages: Math.ceil(count / limit),
      count,
      countOpened: await this.countTicketsByStatus(
        TicketStatus.OPEN,
        options.authorId,
      ),
      countResolved: await this.countTicketWithResolvedAt(options.authorId),
      rows,
    };
  }

  async getTicketById(ticketId: number, userId: number) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    const hasAdminPermission = await this.usersService.hasPermissions(userId, [
      'admin.tickets.view',
    ]);
    if (!hasAdminPermission && ticket?.authorId !== userId)
      throw new ForbiddenException(ErrorCause.FORBIDDEN);

    return ticket;
  }

  async getTicketMessagesWithPagination(
    options: {
      pageInfo: PageInfoDto;
      ticketId: number;
    },
    userId: number,
  ) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: options.ticketId },
    });

    const hasAdminPermission = await this.usersService.hasPermissions(userId, [
      'admin.tickets.view',
    ]);

    if (!hasAdminPermission && ticket?.authorId !== userId)
      throw new ForbiddenException(ErrorCause.FORBIDDEN);

    const { page = 1, limit = 20 } = options.pageInfo;
    const offset = (page - 1) * limit;

    const { count, rows } = await this.ticketsMessageRepository.findAndCountAll(
      {
        where: { ticketId: options.ticketId },
        distinct: true,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      },
    );

    return {
      pages: Math.ceil(count / limit),
      count,
      rows,
    };
  }

  async takeTicket(ticketId: number, employeeId: number) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (ticket?.employeeId)
      throw new BadRequestException(ErrorCause.TICKET_ALREADY_TAKEN);

    return await this.ticketsRepository.update(
      { employeeId, status: TicketStatus.WAITING },
      { where: { id: ticketId } },
    );
  }

  async resolveTicket(ticketId: number, userId: number) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    const hasAdminPermission = await this.usersService.hasPermissions(userId, [
      'admin.tickets.resolve',
    ]);

    if (!hasAdminPermission && ticket?.authorId !== userId)
      throw new ForbiddenException(ErrorCause.FORBIDDEN);

    if (ticket?.status === TicketStatus.RESOLVED)
      throw new BadRequestException(ErrorCause.TICKET_ALREADY_RESOLVED);

    if (ticket?.employeeId !== userId && ticket?.authorId !== userId)
      throw new BadRequestException(ErrorCause.IS_NOT_YOUR_TICKET);

    if (ticket?.authorId !== userId) {
      await this.messagesService.createSystemMessageInSystemChat(
        ticket!.authorId,
        MessageType.SYSTEM_TICKET_IS_RESOLVED,
        { ticketId: ticket!.id },
      );
    }

    return await this.ticketsRepository.update(
      { status: TicketStatus.RESOLVED, resolvedAt: new Date() },
      { where: { id: ticketId } },
    );
  }

  async countTicketWithResolvedAt(authorId?: number) {
    return await this.ticketsRepository.count({
      where: {
        resolvedAt: { [Op.ne]: null },
        ...(authorId ? { authorId } : {}),
      },
    });
  }

  async countTicketsByStatus(status: TicketStatus, authorId?: number) {
    return await this.ticketsRepository.count({
      where: { status, ...(authorId ? { authorId } : {}) },
    });
  }

  async averageResponseTime() {
    const result = await this.ticketsRepository.findOne({
      where: { status: TicketStatus.RESOLVED },
      attributes: [
        [
          Sequelize.fn(
            'AVG',
            Sequelize.literal(
              `EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) * 1000`,
            ),
          ),
          'avgTime',
        ],
      ],
      raw: true,
    });

    return (result as unknown as { avgTime: number })?.avgTime || 0;
  }

  async createTicket(creationAttrs: TicketCreationAttrs) {
    return await this.connection.transaction(async (transaction) => {
      if (creationAttrs.imagesKeys?.length) {
        for await (const imageKey of creationAttrs.imagesKeys) {
          const exists = await this.storageService.fileExists(
            imageKey,
            StorageBuckets.Tickets,
          );
          if (!exists) throw new BadRequestException(ErrorCause.FILE_NOT_FOUND);
        }
      }

      if (creationAttrs.comment || creationAttrs.imagesKeys?.length) {
      }

      const ticket = await this.ticketsRepository.create(creationAttrs, {
        transaction,
      });

      await this.createTicketMessage(
        {
          ticketId: ticket.id,
          text: creationAttrs.comment || '',
          filesKeys: creationAttrs.imagesKeys,
          userId: creationAttrs.authorId,
        },
        { transaction },
      );

      return ticket;
    });
  }

  async createTicketMessage(
    creationAttrs: TicketMessageCreationAttrs,
    options?: CreateOptions<TicketMessage>,
  ) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: creationAttrs.ticketId },
      ...options,
    });

    const hasAdminPermission = await this.usersService.hasPermissions(
      creationAttrs.userId,
      ['admin.tickets.write'],
    );

    if (!hasAdminPermission && ticket?.authorId !== creationAttrs.userId)
      throw new ForbiddenException(ErrorCause.FORBIDDEN);

    if (ticket?.status === TicketStatus.RESOLVED)
      throw new BadRequestException(ErrorCause.TICKET_IS_RESOLVED);

    if (creationAttrs.filesKeys?.length) {
      for await (const fileKey of creationAttrs.filesKeys) {
        const exists = await this.storageService.fileExists(
          fileKey,
          StorageBuckets.Tickets,
        );
        if (!exists) throw new BadRequestException(ErrorCause.FILE_NOT_FOUND);
      }
    }

    if (ticket?.authorId !== creationAttrs.userId) {
      await this.messagesService.createSystemMessageInSystemChat(
        ticket!.authorId,
        MessageType.SYSTEM_TICKET_NEW_ANSWER,
        { ticketId: ticket!.id },
      );
    }

    return await this.ticketsMessageRepository.create(creationAttrs, options);
  }
}
