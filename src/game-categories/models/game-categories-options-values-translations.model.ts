import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Locale } from 'src/graphql';
import { GameCategoryOptionValue } from './game-categories-options-values.model';

export type GameCategoryOptionValueTranslationCreationAttrs = {
  gameCategoryOptionId: number;
  name: string;
};

@Table({
  tableName: 'game-categories-options-values-translations',
  timestamps: true,
})
export class GameCategoryOptionValueTranslation extends Model<
  GameCategoryOptionValueTranslation,
  GameCategoryOptionValueTranslationCreationAttrs
> {
  @ForeignKey(() => GameCategoryOptionValue)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE' })
  declare gameCategoryOptionValueId: number;

  @Column({ type: DataType.ENUM(...Object.values(Locale)) })
  declare locale: Locale;

  @Column({ type: DataType.STRING })
  declare name: string;
}
