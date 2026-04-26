// type GameCategoryTranslation {
//   locale: Locale!
//   label: String!
// }

import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Locale } from 'src/graphql';
import { GameCategory } from './game-categories.model';

export type GameCategoryTranslationCreationAttrs = {
  gameCategoryId: number;
  locale: Locale;
  label: string;
};

@Table({
  tableName: 'game_category_translations',
})
export class GameCategoryTranslation extends Model<
  GameCategoryTranslation,
  GameCategoryTranslationCreationAttrs
> {
  @ForeignKey(() => GameCategory)
  @Column({ type: DataType.INTEGER })
  declare gameCategoryId: number;

  @Column({ type: DataType.ENUM(...Object.values(Locale)) })
  declare locale: Locale;

  @Column({ type: DataType.STRING })
  declare label: string;
}
