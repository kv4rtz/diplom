import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { AchievementType } from 'src/graphql';
import { User } from 'src/users/models/users.model';
import { AchievementTranslation } from './achievements-translations.model';
import { AchievementUser } from './achievements-users.model';

@Table({
  tableName: 'achievements',
  timestamps: true,
})
export class Achievement extends Model {
  @Column({
    type: DataType.ENUM(...Object.values(AchievementType)),
    allowNull: false,
  })
  declare type: AchievementType;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare code: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare iconKey: string;

  @HasMany(() => AchievementTranslation)
  declare translations: AchievementTranslation[];

  @BelongsToMany(() => User, () => AchievementUser)
  declare users: User[];
}
