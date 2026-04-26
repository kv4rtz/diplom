import { DataTypes } from 'sequelize';
import { BelongsToMany, Column, Model, Table } from 'sequelize-typescript';
import { RolePermission } from 'src/roles/models/roles-permissions.model';
import { Role } from 'src/roles/models/roles.model';

export type PermissionCreationAttrs = {
  name: string;
  code: string;
};

@Table({
  tableName: 'permissions',
  modelName: 'Permission',
  timestamps: true,
})
export class Permission extends Model<Permission, PermissionCreationAttrs> {
  @Column({ type: DataTypes.STRING(64), allowNull: false })
  declare name: string;

  @Column({ type: DataTypes.STRING(255), allowNull: false, unique: true })
  declare code: string;

  @BelongsToMany(() => Role, () => RolePermission)
  declare roles: Role[];
}
