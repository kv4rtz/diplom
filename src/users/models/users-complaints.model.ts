import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { ComplaintUserStatus, UserComplaintReason } from 'src/graphql';
import { User } from 'src/users/models/users.model';

export type UserComplaintCreationAttrs = {
  creatorId: number;
  targetId: number;
  reason: UserComplaintReason;
  comment?: string;
};

@Table({ tableName: 'users_complaints' })
export class UserComplaint extends Model<
  UserComplaint,
  UserComplaintCreationAttrs
> {
  @BelongsTo(() => User, { foreignKey: 'creatorId', onDelete: 'CASCADE' })
  declare creator: User;
  declare creatorId: number;

  @BelongsTo(() => User, { foreignKey: 'targetId', onDelete: 'CASCADE' })
  declare target: User;
  declare targetId: number;

  @Column({
    type: DataType.ENUM(...Object.values(UserComplaintReason)),
    allowNull: false,
  })
  declare reason: UserComplaintReason;

  @Column({
    type: DataType.ENUM(...Object.values(ComplaintUserStatus)),
    allowNull: false,
    defaultValue: ComplaintUserStatus.PENDING,
  })
  declare status: ComplaintUserStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare comment: string;
}
