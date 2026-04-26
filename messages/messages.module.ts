import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { ChatsModule } from 'src/chats/chats.module';
import { EventsModule } from 'src/events/events.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { StorageModule } from 'src/storage/storage.module';
import { UsersModule } from 'src/users/users.module';
import { MessagesResolver } from './messages.resolver';
import { MessagesService } from './messages.service';
import { MessageFile } from './models/messages-files.model';
import { Message } from './models/messages.model';
import { ProductModule } from 'src/products/products.module';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Message, MessageFile]),
    PermissionsModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    StorageModule,
    forwardRef(() => EventsModule),
    forwardRef(() => ChatsModule),
    forwardRef(() => ProductModule),
    forwardRef(() => OrdersModule),
  ],
  providers: [MessagesResolver, MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
