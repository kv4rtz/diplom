import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Locale } from 'src/graphql';
import { Role } from './roles.model';

export type RoleTranslationCreationAttrs = {
  roleId: number;
  locale: Locale;
  name: string;
};

@Table({
  tableName: 'role_translations',
  modelName: 'RoleTranslation',
  timestamps: true,
})
export class RoleTranslation extends Model<
  RoleTranslation,
  RoleTranslationCreationAttrs
> {
  @ForeignKey(() => Role)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare roleId: number;

  @Column({ type: DataType.ENUM(...Object.values(Locale)), allowNull: false })
  declare locale: Locale;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @BelongsTo(() => Role)
  declare role: Role;
}
