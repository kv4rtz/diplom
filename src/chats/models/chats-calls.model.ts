import { BelongsTo, Model, Table } from 'sequelize-typescript';
import { User } from 'src/users/models/users.model';
import { Chat } from './chats.model';

export type ChatsCallCreationAttrs = {
  userId: number;
  chatId: number;
};

@Table({
  tableName: 'chats_calls',
})
export class ChatsCall extends Model<ChatsCall, ChatsCallCreationAttrs> {
  @BelongsTo(() => User, 'userId')
  declare user: User;
  declare userId: number;

  @BelongsTo(() => Chat, 'chatId')
  declare chat: Chat;
  declare chatId: number;
}
