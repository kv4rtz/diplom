import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { GameCategory } from 'src/game-categories/models/game-categories.model';
import { SuggestedGameCategory } from 'src/game-categories/models/suggested-game-categories.model';
import { GameType } from 'src/graphql';
import { GameSearch } from './game-searches.model';
import {
  GameTranslation,
  GameTranslationCreationAttrs,
} from './game-translations.model';

export type GameCreationAttrs = {
  slug: string;
  visible: boolean;
  type: GameType;
  iconKey?: string;
  bannerKey?: string;
  translations: Omit<GameTranslationCreationAttrs, 'gameId'>[];
  hideMainSection: boolean;
  haveChat: boolean;
};

@Table({
  tableName: 'games',
  timestamps: true,
})
export class Game extends Model<Game, GameCreationAttrs> {
  @Column({ type: DataType.STRING, unique: true })
  declare slug: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare visible: boolean;

  @Column({ type: DataType.ENUM(...Object.values(GameType)) })
  declare type: GameType;

  @Column({ type: DataType.STRING })
  declare iconKey: string | null;

  @Column({ type: DataType.STRING })
  declare bannerKey: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare haveChat: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare hideMainSection: boolean;

  @HasMany(() => GameTranslation, { onDelete: 'CASCADE' })
  declare translations: GameTranslation[];

  @HasMany(() => GameCategory, { onDelete: 'CASCADE' })
  declare gameCategories: GameCategory[];

  @HasMany(() => GameSearch, { onDelete: 'CASCADE' })
  declare searches: GameSearch[];

  @HasMany(() => SuggestedGameCategory)
  declare suggestedGameCategories: SuggestedGameCategory[];
}
