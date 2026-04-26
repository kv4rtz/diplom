import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { ChatsModule } from 'src/chats/chats.module';
import { MessagesModule } from 'src/messages/messages.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { StorageModule } from 'src/storage/storage.module';
import { UsersModule } from 'src/users/users.module';
import { TicketMessage } from './models/ticket-messages.model';
import { Ticket } from './models/tickets.model';
import { TicketMessagesResolver } from './ticket-messages.resolver';
import { TicketsResolver } from './tickets.resolver';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Ticket, TicketMessage]),
    forwardRef(() => UsersModule),
    AuthModule,
    PermissionsModule,
    StorageModule,
    ChatsModule,
    MessagesModule,
  ],
  providers: [TicketsResolver, TicketsService, TicketMessagesResolver],
})
export class TicketsModule {}
