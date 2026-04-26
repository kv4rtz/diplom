import { DataTypes } from 'sequelize';
import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Permission } from '../../permissions/models/permissions.model';
import { Role } from './roles.model';

export type RolePermissionCreationAttrs = {
  roleId: number;
  permissionId: number;
};

@Table({
  tableName: 'role_permissions',
  timestamps: false,
})
export class RolePermission extends Model<
  RolePermission,
  RolePermissionCreationAttrs
> {
  @ForeignKey(() => Role)
  @Column({ type: DataTypes.INTEGER, allowNull: false })
  declare roleId: number;

  @BelongsTo(() => Role)
  declare role: Role;

  @ForeignKey(() => Permission)
  @Column({ type: DataTypes.INTEGER, allowNull: false })
  declare permissionId: number;

  @BelongsTo(() => Permission)
  declare permission: Permission;
}
