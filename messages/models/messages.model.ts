import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Chat } from 'src/chats/models/chats.model';
import { MessageType } from 'src/graphql';
import { User } from 'src/users/models/users.model';
import { MessageFile } from './messages-files.model';

export type MessageCreationAttrs = {
  type?: MessageType;
  metadata?: Record<string, any>;
  text?: string;
  isSystem?: boolean;
  chatId: number;
  userId: number;
};

@Table({ tableName: 'messages', timestamps: true })
export class Message extends Model<Message, MessageCreationAttrs> {
  @Column({
    type: DataType.ENUM(...Object.values(MessageType)),
    defaultValue: MessageType.TEXT,
  })
  declare type: MessageType;

  @Column({
    type: DataType.JSONB,
  })
  declare metadata?: Record<string, any>;

  @Column({ type: DataType.TEXT })
  declare text?: string;

  @ForeignKey(() => Chat)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare chatId: number;

  @BelongsTo(() => Chat)
  declare chat: Chat;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @Column({ type: DataType.DATE, allowNull: true })
  declare readedAt: Date;

  @HasMany(() => MessageFile)
  declare filesKeys: MessageFile[];

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isSystem: boolean;
}
