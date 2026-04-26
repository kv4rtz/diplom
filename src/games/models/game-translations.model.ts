import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Locale } from 'src/graphql';
import { Game } from './games.model';

export type GameTranslationCreationAttrs = {
  gameId: number;
  locale: Locale;
  name: string;
  description: string;
};

@Table({
  tableName: 'game_translations',
  timestamps: true,
})
export class GameTranslation extends Model<
  GameTranslation,
  GameTranslationCreationAttrs
> {
  @ForeignKey(() => Game)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare gameId: number;

  @BelongsTo(() => Game)
  declare game: Game;

  @Column({
    type: DataType.ENUM(...Object.values(Locale)),
    allowNull: false,
  })
  declare locale: Locale;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;
}
