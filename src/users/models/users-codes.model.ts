import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserCodeType } from 'src/graphql';
import { User } from './users.model';

export type UserCodeCreationAttributes = {
  userId: number;
  code: string;
  type: UserCodeType;
};

@Table({ tableName: 'users_codes', timestamps: true })
export class UserCode extends Model<UserCode, UserCodeCreationAttributes> {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @Column({ type: DataType.STRING(6), allowNull: false, unique: true })
  declare code: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserCodeType)),
    allowNull: false,
  })
  declare type: UserCodeType;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: () => {
      const today = new Date();
      today.setDate(today.getDate() + 3);
      return today;
    },
  })
  declare expiresAt: Date;
}
