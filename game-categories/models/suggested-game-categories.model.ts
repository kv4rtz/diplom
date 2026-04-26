import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Game } from 'src/games/models/games.model';
import { SuggestedGameCategoryStatus } from 'src/graphql';
import { User } from 'src/users/models/users.model';

export type SuggestedGameCategoryCreationAttrs = {
  userId: number;
  gameId: number;
  name: string;
  comment?: string;
};

@Table({
  tableName: 'suggested_game_categories',
})
export class SuggestedGameCategory extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @ForeignKey(() => Game)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare gameId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare comment?: string;

  @Column({
    type: DataType.ENUM(...Object.values(SuggestedGameCategoryStatus)),
    defaultValue: SuggestedGameCategoryStatus.PENDING,
  })
  declare status: SuggestedGameCategoryStatus;
}
