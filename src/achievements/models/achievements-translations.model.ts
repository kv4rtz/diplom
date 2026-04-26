import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Locale } from 'src/graphql';
import { Achievement } from './achievements.model';

@Table({
  tableName: 'achievements_translations',
  timestamps: true,
  indexes: [{ fields: ['achievementId', 'locale'], unique: true }],
})
export class AchievementTranslation extends Model {
  @ForeignKey(() => Achievement)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare achievementId: number;

  @Column({ type: DataType.ENUM(...Object.values(Locale)), allowNull: false })
  declare locale: Locale;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;
}
