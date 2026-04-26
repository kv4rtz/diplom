import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Message } from './messages.model';

export type MessageFileCreationAttrs = {
  messageId: number;
  fileKey: string;
};

@Table({ tableName: 'messages_files' })
export class MessageFile extends Model<MessageFile, MessageFileCreationAttrs> {
  @ForeignKey(() => Message)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare messageId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare fileKey: string;
}
