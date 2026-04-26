import { ForbiddenError } from '@nestjs/apollo';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { ErrorCause } from 'src/errors-couse';
import { EventsService } from 'src/events/events.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { ChatMemberRoles } from 'src/graphql';
import { KafkaService } from 'src/kafka/kafka.service';
import { Message } from 'src/messages/models/messages.model';
import { toCallMemberPayload } from 'src/notifications/replacers/call-member';
import { UsersService } from 'src/users/users.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsCall } from './models/chats-calls.model';
import { ChatMember } from './models/chats-members.model';
import { Chat } from './models/chats.model';

@Injectable()
export class ChatsService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Chat) private readonly chatsRepository: typeof Chat,
    @InjectModel(ChatMember)
    private readonly chatsMembersRepository: typeof ChatMember,
    @InjectModel(ChatsCall)
    private readonly chatsCallsRepository: typeof ChatsCall,
    private readonly eventsService: EventsService,
    private readonly usersService: UsersService,
    private readonly kafkaService: KafkaService,
  ) {}

  async getChatMembers(chatId: number, options?: FindOptions<ChatMember>) {
    return await this.chatsMembersRepository.findAll({
      ...options,
      where: { chatId, ...options?.where },
    });
  }

  async getUserChatIds(userId: number) {
    const chatsMembers = await this.chatsMembersRepository.findAll({
      where: { userId },
    });

    return chatsMembers.map((chatMember) => chatMember.chatId);
  }

  async getUserChats(userId: number, pageInfo: PageInfoDto) {
    const chatsMembers = await this.chatsMembersRepository.findAll({
      where: { userId },
    });

    if (!chatsMembers.length)
      return {
        rows: [],
        count: 0,
        pages: 0,
      };

    const { page = 1, limit = 20 } = pageInfo;
    const offset = (page - 1) * limit;

    const { rows, count } = await this.chatsRepository.findAndCountAll({
      where: {
        id: { [Op.in]: chatsMembers.map((chatMember) => chatMember.chatId) },
      },
      limit,
      offset,
      distinct: true,
      subQuery: false,
      attributes: {
        include: [
          [
            Sequelize.literal(
              `(SELECT COUNT("createdAt") FROM "messages" WHERE "messages"."chatId" = "Chat"."id" AND "messages"."userId" != :userId AND "messages"."readedAt" IS NULL)`,
            ),
            'newMessageCount',
          ],
        ],
      },
      include: [
        {
          model: ChatMember,
          as: 'members',
          attributes: [],
          where: { userId },
        },
        {
          model: Message,
          as: 'messages',
          through: { attributes: [] },
          attributes: ['id', 'text', 'createdAt', 'userId'],
          required: false,
          limit: 1,
          separate: false,
          order: [['createdAt', 'DESC']],
        },
      ],
      order: [
        ['isSystem', 'DESC'],
        [{ model: ChatMember, as: 'members' }, 'cursor', 'DESC NULLS LAST'],
        [
          Sequelize.literal(`(
        SELECT MAX("createdAt") 
        FROM "messages" 
        WHERE "messages"."chatId" = "Chat"."id"
      )`),
          'DESC NULLS LAST',
        ],
      ],
      replacements: {
        userId,
      },
    });

    return {
      rows,
      count,
      pages: Math.ceil(count / limit),
    };
  }

  async canCall(userId: number, chatId: number) {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const cooldownBorder = new Date(now.getTime() - 15 * 60 * 1000);

    const callsToday = await this.chatsCallsRepository.count({
      where: {
        userId,
        chatId,
        createdAt: {
          [Op.gte]: startOfDay,
        },
      },
    });

    if (callsToday >= 3) return false;

    try {
      const lastCallInCooldown = await this.chatsCallsRepository.findOne({
        where: {
          userId,
          chatId,
          createdAt: {
            [Op.gte]: cooldownBorder,
          },
        },
        order: [['createdAt', 'DESC']],
      });
      return !lastCallInCooldown;
    } catch (e) {
      if (e instanceof NotFoundException) return true;
    }

    return false;
  }
  async createChatCall(userId: number, chatId: number) {
    return await this.sequelize.transaction(async (t) => {
      const newCall = await this.chatsCallsRepository.create(
        { userId, chatId },
        { transaction: t },
      );

      await this.sequelize.query(
        `
      DELETE FROM "${this.chatsCallsRepository.tableName}"
      WHERE id IN (
        SELECT id FROM (
          SELECT id
          FROM "${this.chatsCallsRepository.tableName}"
          WHERE "userId" = :userId
            AND "chatId" = :chatId
          ORDER BY "createdAt" DESC
          OFFSET 3
        ) sub
      )
      `,
        {
          replacements: { userId, chatId },
          transaction: t,
        },
      );

      return newCall;
    });
  }

  async getChatById(userId: number, id: number, transaction?: Transaction) {
    const chat = await this.chatsRepository.findByPk(id, { transaction });

    if (!(await this.checkUserInChat(userId, chat?.id, transaction)))
      throw new ForbiddenError(ErrorCause.FORBIDDEN);

    return chat;
  }

  async getChatByMemberId(
    userId: number,
    memberId: number,
    transaction?: Transaction,
  ) {
    const userChatMembers = await this.chatsMembersRepository.findAll({
      where: { userId },
      transaction,
    });

    const memberChatMembers = await this.chatsMembersRepository.findAll({
      where: { userId: memberId },
      transaction,
    });

    const commonChats = userChatMembers.filter((chatMember) => {
      return memberChatMembers.some((memberChatMember) => {
        return chatMember.chatId === memberChatMember.chatId;
      });
    });

    if (!commonChats.length) throw new NotFoundException(ErrorCause.NOT_FOUND);

    return await this.chatsRepository.findOne({
      where: { id: commonChats[0].chatId },
      transaction,
    });
  }

  async callMember(
    userId: number,
    memberId: number,
    transaction?: Transaction,
  ) {
    const chat = await this.getChatByMemberId(userId, memberId, transaction);
    if (!chat) throw new NotFoundException(ErrorCause.NOT_FOUND);

    if (!(await this.canCall(userId, chat.id)))
      throw new ForbiddenError(ErrorCause.CALL_LIMIT_REACHED);

    await this.createChatCall(userId, chat.id);

    const user = await this.usersService.getUserById(userId);
    const member = await this.usersService.getUserById(memberId);

    const socket = this.eventsService.getUserSocket(memberId);
    if (socket) {
      this.eventsService.callMember(chat.id, user?.id, memberId);
    } else {
      this.kafkaService.produce(
        'notifications.call.member',
        toCallMemberPayload({
          email: member?.email || '',
          nickname: user?.login || '',
          chatId: chat.id,
        }),
      );
    }

    return true;
  }

  async checkChatExists(
    user1Id: number,
    user2Id: number,
    transaction?: Transaction,
  ) {
    try {
      const chats = await this.chatsRepository.findAll({
        include: [
          {
            model: ChatMember,
            where: {
              role: ChatMemberRoles.member,
              userId: { [Op.in]: [user1Id, user2Id] },
            },
          },
        ],
        transaction,
      });

      return chats.find((chat) => {
        const memberIds = chat.members.map((m) => m.userId);
        return memberIds.includes(user1Id) && memberIds.includes(user2Id);
      });
    } catch {
      return null;
    }
  }

  async createOrFindSystemChatForUser(
    userId: number,
    options?: FindOptions<Chat>,
  ) {
    try {
      const exists = await this.chatsRepository.findOne({
        where: { isSystem: true },
        include: [{ model: ChatMember, required: true, where: { userId } }],
        ...options,
      });

      this.eventsService.connectUserToChat(userId, exists!.id);

      if (exists) return exists;
    } catch (e) {
      if (e instanceof NotFoundException) {
        const chat = await this.chatsRepository.create(
          {
            name: 'BetaGames',
            isSystem: true,
            members: [{ userId }],
          },
          {
            include: [ChatMember],
            ...options,
          },
        );
        this.eventsService.connectUserToChat(userId, chat.id);
        return chat;
      } else throw e;
    }
  }

  async createChat(
    userId: number,
    dto: CreateChatDto,
    transaction?: Transaction,
  ) {
    if (userId === dto.member) {
      return await this.createOrFindSystemChatForUser(userId, { transaction });
    }

    const isExists = await this.checkChatExists(
      userId,
      dto.member,
      transaction,
    );
    if (isExists) {
      const chatByMemberId = await this.getChatByMemberId(
        userId,
        dto.member,
        transaction,
      );

      this.eventsService.connectUserToChat(userId, chatByMemberId!.id);
      this.eventsService.connectUserToChat(dto.member, chatByMemberId!.id);
      return chatByMemberId;
    }

    const chat = await this.chatsRepository.create(
      {
        name: dto.name,
        members: [{ userId }, { userId: dto.member }],
      },
      {
        include: [ChatMember],
        transaction,
      },
    );

    this.eventsService.connectUserToChat(userId, chat!.id);
    this.eventsService.connectUserToChat(dto.member, chat!.id);

    return chat.reload({ transaction });
  }

  async checkUserInChat(
    userId: number,
    chatId: number,
    transaction?: Transaction,
  ) {
    try {
      return await this.chatsMembersRepository.findOne({
        where: { userId, chatId },
        transaction,
      });
    } catch {
      return null;
    }
  }

  async getAllNewMessageCount(userId: number) {
    try {
      const [{ count }] = await this.sequelize.query<{ count: string }>(
        `
        SELECT COUNT(DISTINCT "messages"."id") AS count
        FROM "messages"
        INNER JOIN "chats" ON "messages"."chatId" = "chats"."id"
        INNER JOIN "chats_members" ON "chats"."id" = "chats_members"."chatId"
        WHERE "chats_members"."userId" = :userId
          AND "messages"."userId" != :userId
          AND "messages"."readedAt" IS NULL
        `,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        },
      );

      return Number(count || 0);
    } catch (e) {
      return null;
    }
  }

  async toggleChatNotification(chatId: number, userId: number) {
    const chatMember = await this.chatsMembersRepository.findOne({
      where: { chatId, userId },
    });

    if (!chatMember) throw new NotFoundException(ErrorCause.NOT_FOUND);

    const notify = !chatMember.notify;
    chatMember.set('notify', notify);
    await chatMember.save();

    return notify;
  }

  async toggleChatCursor(chatId: number, userId: number) {
    const chatMember = await this.chatsMembersRepository.findOne({
      where: { chatId, userId },
    });

    if (!chatMember) throw new NotFoundException(ErrorCause.NOT_FOUND);

    const cursor = chatMember.cursor ? null : new Date();
    chatMember.set('cursor', cursor);
    await chatMember.save();

    return !!cursor;
  }

  async isChatPinned(chatId: number, userId: number) {
    const chatMember = await this.chatsMembersRepository.findOne({
      where: { chatId, userId },
      attributes: ['cursor'],
    });
    if (!chatMember) return null;
    return !!chatMember?.cursor;
  }

  async isChatNotified(chatId: number, userId: number) {
    const chatMember = await this.chatsMembersRepository.findOne({
      where: { chatId, userId },
      attributes: ['notify'],
    });
    if (!chatMember) return null;
    return chatMember?.notify;
  }
}
