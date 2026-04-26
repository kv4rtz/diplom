import { DataTypes } from 'sequelize';
import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Role } from 'src/roles/models/roles.model';
import { User } from './users.model';

type UserRoleCreationAttrs = {
  userId: number;
  roleId: number;
};

@Table({
  tableName: 'user_roles',
  modelName: 'UserRole',
  timestamps: false,
})
export class UserRole extends Model<UserRole, UserRoleCreationAttrs> {
  @ForeignKey(() => User)
  @Column({ type: DataTypes.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @ForeignKey(() => Role)
  @Column({ type: DataTypes.INTEGER, allowNull: false })
  declare roleId: number;
}
