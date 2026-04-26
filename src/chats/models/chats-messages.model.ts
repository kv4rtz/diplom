import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Message } from 'src/messages/models/messages.model';
import { Chat } from './chats.model';

@Table({ tableName: 'chats_messages' })
export class ChatMessage extends Model<ChatMessage> {
  @ForeignKey(() => Chat)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare chatId: number;

  @ForeignKey(() => Message)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare messageId: number;
}
