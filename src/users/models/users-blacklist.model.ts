import { BelongsTo, Model, Table } from 'sequelize-typescript';
import { User } from './users.model';

export type UserBlacklistCreationAttributes = {
  ownerId: number;
  bannedUserId: number;
};

@Table({
  tableName: 'user_blacklist',
  indexes: [{ unique: true, fields: ['ownerId', 'bannedUserId'] }],
})
export class UserBlacklist extends Model<
  UserBlacklist,
  UserBlacklistCreationAttributes
> {
  @BelongsTo(() => User, 'ownerId')
  declare owner: User;
  declare ownerId: number;

  @BelongsTo(() => User, 'bannedUserId')
  declare bannedUser: User;
  declare bannedUserId: number;
}
