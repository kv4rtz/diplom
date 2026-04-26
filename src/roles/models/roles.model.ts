import { DataTypes } from 'sequelize';
import {
  BelongsToMany,
  Column,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Permission } from 'src/permissions/models/permissions.model';
import { UserRole } from 'src/users/models/users-roles.model';
import { User } from 'src/users/models/users.model';
import {
  RolePermission,
  RolePermissionCreationAttrs,
} from './roles-permissions.model';
import {
  RoleTranslation,
  RoleTranslationCreationAttrs,
} from './roles-translations.model';

export type RoleCreationAttrs = {
  code: string;
  translations?: Omit<RoleTranslationCreationAttrs, 'roleId'>[];
  permissions?: RolePermissionCreationAttrs;
};

@Table({
  tableName: 'roles',
  modelName: 'Role',
  timestamps: true,
})
export class Role extends Model<Role, RoleCreationAttrs> {
  @Column({ type: DataTypes.STRING(64), allowNull: false, unique: true })
  declare code: string;

  @BelongsToMany(() => Permission, () => RolePermission)
  declare permissions: Permission[];

  @HasMany(() => RoleTranslation)
  declare translations: RoleTranslation[];

  @BelongsToMany(() => User, () => UserRole)
  declare users: User[];
}
