import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/models/users.model';
import { Game } from './games.model';

export type GameFavouriteCreationAttrs = {
  gameId: number;
  userId: number;
};

@Table({
  tableName: 'game_favourites',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'gameId'],
    },
  ],
})
export class GameFavourite extends Model<
  GameFavourite,
  GameFavouriteCreationAttrs
> {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @ForeignKey(() => Game)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare gameId: number;
}
