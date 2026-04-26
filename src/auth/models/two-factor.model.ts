import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/models/users.model';

export type TwoFactorCreationAttrs = {
  userId: number;
  twoFactorSecret: string;
  isTwoFactorEnabled: boolean;
  twoFactorBackupCodes: string[];
};

@Table({
  tableName: 'two_factor',
})
export class TwoFactor extends Model<TwoFactor, TwoFactorCreationAttrs> {
  @BelongsTo(() => User, 'userId')
  declare user: User;
  declare userId: number;

  @Column({ type: DataType.STRING, allowNull: true })
  declare twoFactorSecret: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isTwoFactorEnabled: boolean;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare twoFactorBackupCodes: string[];
}
