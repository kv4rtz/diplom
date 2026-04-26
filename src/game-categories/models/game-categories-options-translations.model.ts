import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Locale } from 'src/graphql';
import { GameCategoryOption } from './game-categories-options.model';

export type GameCategoryOptionTranslationCreationAttrs = {
  gameCategoryOptionId: number;
  locale: Locale;
  name: string;
};

@Table({
  tableName: 'game_category_option_translations',
})
export class GameCategoryOptionTranslation extends Model<
  GameCategoryOptionTranslation,
  GameCategoryOptionTranslationCreationAttrs
> {
  @ForeignKey(() => GameCategoryOption)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE' })
  declare gameCategoryOptionId: number;

  @Column({ type: DataType.ENUM(...Object.values(Locale)) })
  declare locale: Locale;

  @Column({ type: DataType.STRING })
  declare name: string;
}
