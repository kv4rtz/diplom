import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserTradingOption } from 'src/graphql';
import { User } from './users.model';

export type UserOptionCreationAttrs = {
  userId: number;
  tradingOption?: UserTradingOption;
};

@Table({
  tableName: 'user_options',
})
export class UserOption extends Model<UserOption, UserOptionCreationAttrs> {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare userId: number;

  @BelongsTo(() => User, 'userId')
  declare user: User;

  @Column({
    type: DataType.ENUM(...Object.values(UserTradingOption)),
    defaultValue: UserTradingOption.SHOW_ALL_MY_PRODUCTS,
  })
  declare tradingOption: UserTradingOption;
}
