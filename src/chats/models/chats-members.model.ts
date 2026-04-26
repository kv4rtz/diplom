import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ChatMemberRoles } from 'src/graphql';
import { User } from 'src/users/models/users.model';
import { Chat } from './chats.model';

export type ChatMemberCreationAttrs = {
  chatId: number;
  userId: number;
  role?: ChatMemberRoles;
};

@Table({
  tableName: 'chats_members',
  timestamps: true,
})
export class ChatMember extends Model<ChatMember, ChatMemberCreationAttrs> {
  @ForeignKey(() => Chat)
  @Column({ type: DataType.INTEGER })
  declare chatId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @Column({
    type: DataType.ENUM(...Object.values(ChatMemberRoles)),
    defaultValue: ChatMemberRoles.member,
  })
  declare role: ChatMemberRoles;

  @Column({ type: DataType.DATE })
  declare cursor: Date | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare notify: boolean;
}
