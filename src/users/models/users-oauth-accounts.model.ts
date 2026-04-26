import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './users.model';

export type UserOAuthAccountCreationAttrs = {
  userId: number;
  provider: string;
};

@Table({ tableName: 'users_oauth_accounts', timestamps: true, paranoid: true })
export class UserOAuthAccount extends Model<
  UserOAuthAccount,
  UserOAuthAccountCreationAttrs
> {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @Column({ type: DataType.STRING, allowNull: false })
  declare provider: string;
}
