import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Message } from 'src/messages/models/messages.model';
import { ChatMember, ChatMemberCreationAttrs } from './chats-members.model';
import { ChatMessage } from './chats-messages.model';

export type ChatCreationAttrs = {
  name?: string;
  members: Omit<ChatMemberCreationAttrs, 'chatId'>[];
  isSystem?: boolean;
};

@Table({
  tableName: 'chats',
  timestamps: true,
})
export class Chat extends Model<Chat, ChatCreationAttrs> {
  @Column({ type: DataType.STRING })
  declare name?: string;

  @HasMany(() => ChatMember)
  declare members: ChatMember[];

  @BelongsToMany(() => Message, () => ChatMessage)
  declare messages: Message[];

  @HasMany(() => ChatMessage)
  declare chatMessages: ChatMessage[];

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isSystem: boolean;
}
