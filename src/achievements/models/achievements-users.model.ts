import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/models/users.model';
import { Achievement } from './achievements.model';

@Table({
  tableName: 'achievements_users',
  timestamps: true,
  indexes: [{ fields: ['achievementId', 'userId'], unique: true }],
})
export class AchievementUser extends Model {
  @ForeignKey(() => Achievement)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare achievementId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @BelongsTo(() => Achievement)
  declare achievement: Achievement;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @Column({ type: DataType.SMALLINT })
  declare positionInPinning: number | null;
}
