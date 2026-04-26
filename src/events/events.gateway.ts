import { UseFilters, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { ChatsService } from 'src/chats/chats.service';
import { WebSocketExceptionsFilter } from 'src/global/filters/ws-exception.filter';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { EventsService } from './events.service';

@WebSocketGateway(Number(process.env.WS_PORT || 3001))
@UseFilters(new WebSocketExceptionsFilter())
export class EventsGateway {
  @WebSocketServer() private readonly server: Server;
  afterInit() {
    this.eventsService.setServer(this.server);
  }

  constructor(
    private readonly eventsService: EventsService,
    private readonly usersService: UsersService,
    private readonly authGuard: AuthGuard,
    private readonly chatsService: ChatsService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      this.authGuard.setContextType('ws');
      const user = await this.authGuard.getUserByAuthHeader(
        client.request.headers?.authorization,
      );

      this.eventsService.addUserSocket(user.id, client.id);

      this.usersService.setUserOnline(user.id);
      this.eventsService.emit('user_online', user.id);

      const chatIds = await this.chatsService.getUserChatIds(user.id);
      for (const chatId of chatIds) {
        await client.join(`chat_${chatId}`);
      }
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      this.authGuard.setContextType('ws');
      const user = await this.authGuard.getUserByAuthHeader(
        client.request.headers?.authorization,
      );

      this.eventsService.removeUserSocket(user.id);
      this.usersService.setUserOffline(user.id);
      this.eventsService.emit('user_offline', user.id);

      const chatIds = await this.chatsService.getUserChatIds(user.id);
      for (const chatId of chatIds) {
        await client.leave(`chat_${chatId}`);
      }
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('message')
  // @RequiredPermission('message.send')
  @UseGuards(PermissionsGuard)
  handleEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string },
    @CtxUser() user: User,
  ) {
    // console.log(client, data);
  }
}
