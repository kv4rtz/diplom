import { Op } from 'sequelize';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/models/users.model';

export type BgrHistoryCrationAttributes = {
  userId: number;
  bgr: number;
};

@Table({
  timestamps: true,
  tableName: 'bgr_history',
  indexes: [
    {
      name: 'idx_bgr_history_user_created',
      fields: ['userId', 'createdAt'],
    },
    {
      name: 'idx_bgr_history_bgr',
      fields: ['bgr'],
    },
    {
      name: 'idx_bgr_history_positive_bgr',
      fields: ['bgr'],
      where: {
        bgr: { [Op.gt]: 0 },
      },
    },
  ],
})
export class BgrHistory extends Model<BgrHistory, BgrHistoryCrationAttributes> {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @Column({ type: DataType.DECIMAL(10, 0), allowNull: false })
  declare bgr: number;
}
