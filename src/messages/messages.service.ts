import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, Sequelize, Transaction } from 'sequelize';
import { ChatsService } from 'src/chats/chats.service';
import { ErrorCause } from 'src/errors-couse';
import { EventsService } from 'src/events/events.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { ChatMemberRoles, MessageType } from 'src/graphql';
import { OrdersService } from 'src/orders/orders.service';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { UsersService } from 'src/users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageFile } from './models/messages-files.model';
import { Message } from './models/messages.model';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message) private readonly messagesRepository: typeof Message,
    @InjectModel(MessageFile)
    private readonly messageFilesRepository: typeof MessageFile,
    @InjectConnection()
    private readonly connection: Sequelize,
    private readonly chatsService: ChatsService,
    private readonly storageService: StorageService,
    private readonly eventsService: EventsService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  async getChatMessages(chatId: number, pageInfo: PageInfoDto, userId: number) {
    const check = await this.chatsService.checkUserInChat(userId, chatId);
    if (!check) throw new ForbiddenException(ErrorCause.FORBIDDEN);

    const { page = 1, limit = 20 } = pageInfo;
    const offset = (page - 1) * limit;

    const { rows, count } = await this.messagesRepository.findAndCountAll({
      where: { chatId },
      limit,
      offset,
      distinct: true,
      order: [['createdAt', 'DESC']],
    });

    return {
      rows,
      count,
      pages: Math.ceil(count / limit),
    };
  }

  async getMessageFileKeys(messageId: number, transaction?: Transaction) {
    return await this.messageFilesRepository.findAll({
      where: { messageId },
      transaction,
    });
  }

  async markMessageAsRead(userId: number, messageId: number) {
    const message = await this.messagesRepository.findByPk(messageId);

    if (message?.userId === userId)
      throw new ForbiddenException(ErrorCause.FORBIDDEN);

    const check = await this.chatsService.checkUserInChat(
      userId,
      message?.chatId!,
    );
    if (!check) throw new ForbiddenException(ErrorCause.FORBIDDEN);

    await message?.update({ readedAt: new Date() });

    this.eventsService.emitMessage(message?.chatId!, message);

    return true;
  }

  async createSystemMessageInSystemChat(
    userId: number,
    type: MessageType,
    metadata?: Record<string, any>,
    options?: FindOptions<Message>,
  ) {
    const chat = await this.chatsService.createOrFindSystemChatForUser(userId, {
      transaction: options?.transaction,
    });

    const message = await this.messagesRepository.create(
      { chatId: chat!.id, type, metadata, userId, isSystem: true },
      options,
    );

    const members = await this.chatsService.getChatMembers(chat!.id, {
      transaction: options?.transaction,
    });

    this.eventsService.emitChat(chat!.id, message, members);

    return message;
  }

  async createSystemMessage(
    userId: number,
    chatId: number,
    type: MessageType,
    metadata?: Record<string, any>,
    options?: FindOptions<Message>,
  ) {
    const message = await this.messagesRepository.create(
      { chatId, type, metadata, userId, isSystem: true },
      options,
    );

    const members = await this.chatsService.getChatMembers(chatId, {
      transaction: options?.transaction,
    });

    this.eventsService.emitChat(chatId, message, members);

    return message;
  }

  async throwIfMemberInBlacklist(
    chatId: number,
    userId: number,
    transaction?: Transaction,
  ) {
    const membersWithMemberRole = await this.chatsService.getChatMembers(
      chatId,
      {
        where: { role: ChatMemberRoles.member },
        transaction,
      },
    );

    const member = membersWithMemberRole.find(
      (member) => member.userId !== userId,
    );
    if (member) {
      const openedOrders =
        await this.ordersService.getOpenOrdersBySellerOrBuyer(
          userId,
          member.userId,
          {
            transaction,
          },
        );

      if (openedOrders.length === 0) {
        const checkInYourBlacklist =
          await this.usersService.checkUserInBlacklist(
            {
              ownerId: userId,
              bannedUserId: member.userId,
            },
            { transaction },
          );

        if (checkInYourBlacklist)
          throw new ForbiddenException(ErrorCause.YOU_BLACKLISTED_HIM);

        const checkInHimBlacklist =
          await this.usersService.checkUserInBlacklist(
            {
              ownerId: member.userId,
              bannedUserId: userId,
            },
            { transaction },
          );

        if (checkInHimBlacklist)
          throw new ForbiddenException(ErrorCause.HIM_BLACKLISTED_YOU);
      }
    }
  }

  async createMessage(userId: number, dto: CreateMessageDto) {
    return await this.connection.transaction(async (transaction) => {
      const check = await this.chatsService.checkUserInChat(
        userId,
        dto.chatId,
        transaction,
      );
      if (!check) throw new ForbiddenException(ErrorCause.FORBIDDEN);

      await this.throwIfMemberInBlacklist(dto.chatId, userId, transaction);

      const message = await this.messagesRepository.create(
        { ...dto, userId },
        { transaction },
      );

      if (dto.files) {
        const filesKeys: string[] = [];

        for (const file of dto.files) {
          const isExists = this.storageService.fileExists(
            file,
            StorageBuckets.Messages,
          );
          if (!isExists) throw new NotFoundException(ErrorCause.NOT_FOUND);

          filesKeys.push(file);
        }

        await this.messageFilesRepository.bulkCreate(
          filesKeys.map((fileKey) => ({
            messageId: message.id,
            fileKey,
          })),
          { transaction },
        );
      }

      const msg = await message.reload({
        transaction,
      });

      const user = await this.usersService.getUserById(msg.userId);
      const members = await this.chatsService.getChatMembers(dto.chatId, {
        transaction,
      });

      this.eventsService.emitChat(
        dto.chatId,
        {
          ...msg.dataValues,
          files: await this.getFilesDownloadUrls(msg.id, transaction),
          user: {
            id: user?.id,
            avatar: user?.avatarKey
              ? await this.storageService.getDownloadUrl(
                  user.avatarKey,
                  StorageBuckets.Avatars,
                )
              : null,
            login: user?.login,
          },
        },
        members,
      );

      return msg;
    });
  }

  async getFilesDownloadUrls(messageId: number, transaction?: Transaction) {
    const fileKeys = await this.getMessageFileKeys(messageId, transaction);
    if (!fileKeys) return null;

    const files = await Promise.all(
      fileKeys.map((key) =>
        this.storageService.getDownloadUrl(
          key.fileKey,
          StorageBuckets.Messages,
        ),
      ),
    );

    return files;
  }

  async updateMessage(userId: number, dto: UpdateMessageDto) {
    return await this.connection.transaction(async (transaction) => {
      const message = await this.messagesRepository.findByPk(dto.id, {
        include: [MessageFile],
        transaction,
      });

      if (message?.userId !== userId)
        throw new ForbiddenException(ErrorCause.FORBIDDEN);

      await message?.update({ text: dto.text }, { transaction });

      if (dto.files) {
        for (const msgFk of message.filesKeys) {
          this.storageService.deleteFile(
            msgFk.fileKey,
            StorageBuckets.Messages,
          );

          await msgFk.destroy({ transaction });
        }

        const filesKeys: string[] = [];

        for (const file of dto.files) {
          const isExists = this.storageService.fileExists(
            file,
            StorageBuckets.Messages,
          );
          if (!isExists) throw new NotFoundException(ErrorCause.NOT_FOUND);

          filesKeys.push(file);
        }

        await this.messageFilesRepository.bulkCreate(
          filesKeys.map((fileKey) => ({
            messageId: message.id,
            fileKey,
          })),
          { transaction },
        );
      }

      const msg = await message.reload({
        transaction,
      });

      this.eventsService.emitMessage(message?.chatId!, msg);

      return msg;
    });
  }

  async deleteMessage(userId: number, messageId: number) {
    return await this.connection.transaction(async (transaction) => {
      const message = await this.messagesRepository.findByPk(messageId);

      if (message?.userId !== userId)
        throw new ForbiddenException(ErrorCause.FORBIDDEN);

      if (message.filesKeys) {
        for (const msgFk of message.filesKeys) {
          this.storageService.deleteFile(
            msgFk.fileKey,
            StorageBuckets.Messages,
          );

          await msgFk.destroy({ transaction });
        }
      }

      await message?.destroy({ transaction });

      return true;
    });
  }

  async getLastMessageByChatId(chatId: number) {
    try {
      return await this.messagesRepository.findOne({
        where: { chatId },
        order: [['createdAt', 'DESC']],
      });
    } catch {
      return null;
    }
  }

  async getNewMessageCountInChat(chatId: number, userId: number) {
    try {
      return await this.messagesRepository.count({
        // @ts-ignore
        where: {
          chatId,
          userId: {
            [Op.ne]: userId,
          },
          readedAt: {
            [Op.is]: null,
          },
        },
      });
    } catch (e) {
      return null;
    }
  }
}
