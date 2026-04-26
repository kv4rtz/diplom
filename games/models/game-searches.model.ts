import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Game } from './games.model';

export type GameSearchCreationAttrs = {
  gameId: number;
  query: string;
};

@Table({ tableName: 'game_searches', timestamps: true })
export class GameSearch extends Model<GameSearch, GameSearchCreationAttrs> {
  @ForeignKey(() => Game)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare gameId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare query: string;
}
