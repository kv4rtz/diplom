import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { EventsModule } from 'src/events/events.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { MessagesModule } from 'src/messages/messages.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { UsersModule } from 'src/users/users.module';
import { ChatsMembersResolver } from './chats-members.resolver';
import { ChatsResolver } from './chats.resolver';
import { ChatsService } from './chats.service';
import { ChatsCall } from './models/chats-calls.model';
import { ChatMember } from './models/chats-members.model';
import { ChatMessage } from './models/chats-messages.model';
import { Chat } from './models/chats.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Chat, ChatMember, ChatMessage, ChatsCall]),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    PermissionsModule,
    forwardRef(() => MessagesModule),
    EventsModule,
    KafkaModule,
  ],
  providers: [ChatsResolver, ChatsMembersResolver, ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
