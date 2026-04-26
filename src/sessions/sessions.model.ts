import { DataTypes } from 'sequelize';
import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/models/users.model';

export type SessionCreationAttributes = {
  userId: number;
  refreshToken: string;
  browser?: string;
  os?: string;
  device?: string;
  ua?: string;
  ip?: string;
  city?: string;
};

@Table({
  tableName: 'sessions',
  timestamps: true,
})
export class Session extends Model<Session, SessionCreationAttributes> {
  @ForeignKey(() => User)
  @Column({
    type: DataTypes.BIGINT,
    allowNull: false,
  })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  })
  declare refreshToken: string;

  @Column({
    type: DataTypes.STRING(100),
  })
  declare browser?: string;

  @Column({
    type: DataTypes.STRING(100),
  })
  declare os?: string;

  @Column({
    type: DataTypes.STRING(100),
  })
  declare device?: string;

  @Column({
    type: DataTypes.STRING(512),
  })
  declare ua?: string;

  @Column({
    type: DataTypes.INET,
    validate: {
      isIP: true,
    },
  })
  declare ip?: string;

  @Column({
    type: DataTypes.STRING(100),
  })
  declare city?: string;

  @Column({
    type: DataTypes.DATE,
    defaultValue: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })
  declare expiredAt: Date;
}
