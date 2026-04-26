import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { type Chat } from 'src/graphql';
import { MessagesService } from 'src/messages/messages.service';
import { User } from 'src/users/models/users.model';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Resolver('Chat')
export class ChatsResolver {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Query()
  @UseGuards(AuthGuard)
  async allNewMessageCount(@CtxUser() user: User) {
    return await this.chatsService.getAllNewMessageCount(user.id);
  }

  @Query()
  @UseGuards(AuthGuard)
  myChats(@CtxUser() user: User, @Args('pageInfo') pageInfo: PageInfoDto) {
    return this.chatsService.getUserChats(user.id, pageInfo);
  }

  @Query()
  @UseGuards(AuthGuard)
  chatByMemberId(@Args('memberId') memberId: number, @CtxUser() user: User) {
    return this.chatsService.getChatByMemberId(user.id, memberId);
  }

  @Query()
  @UseGuards(AuthGuard)
  chatById(@Args('id') id: number, @CtxUser() user: User) {
    return this.chatsService.getChatById(user.id, id);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  callMember(@Args('memberId') memberId: number, @CtxUser() user: User) {
    return this.chatsService.callMember(user.id, memberId);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  createChat(@Args() dto: CreateChatDto, @CtxUser() user: User) {
    return this.chatsService.createChat(user.id, dto);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async toggleChatNotification(
    @Args('chatId') chatId: number,
    @CtxUser() user: User,
  ) {
    return this.chatsService.toggleChatNotification(chatId, user.id);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async toggleChatCursor(
    @Args('chatId') chatId: number,
    @CtxUser() user: User,
  ) {
    return this.chatsService.toggleChatCursor(chatId, user.id);
  }

  @Query()
  @UseGuards(AuthGuard)
  async checkExistsChatWithUser(
    @Args('memberId') memberId: number,
    @CtxUser() user: User,
  ) {
    return !!(await this.chatsService.checkChatExists(user.id, memberId));
  }

  @ResolveField()
  async members(chat: Chat) {
    return await this.chatsService.getChatMembers(chat.id);
  }

  @ResolveField()
  async lastMessage(chat: Chat) {
    return await this.messagesService.getLastMessageByChatId(chat.id);
  }

  @ResolveField()
  async newMessageCount(@Parent() chat: Chat, @CtxUser() user: User) {
    if (!user || !chat) return null;
    return await this.messagesService.getNewMessageCountInChat(
      chat.id,
      user.id,
    );
  }
  @ResolveField()
  async pinned(@Parent() chat: Chat, @CtxUser() user: User) {
    if (!user || !chat) return null;
    return await this.chatsService.isChatPinned(chat.id, user.id);
  }

  @ResolveField()
  async notify(@Parent() chat: Chat, @CtxUser() user: User) {
    if (!user || !chat) return null;
    return await this.chatsService.isChatNotified(chat.id, user.id);
  }
}
