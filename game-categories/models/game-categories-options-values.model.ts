import {
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import {
  GameCategoryOptionValueTranslation,
  GameCategoryOptionValueTranslationCreationAttrs,
} from './game-categories-options-values-translations.model';
import { GameCategoryOption } from './game-categories-options.model';

export type GameCategoryOptionValueCreationAttrs = {
  gameCategoryOptionId: number;
  translations: Omit<
    GameCategoryOptionValueTranslationCreationAttrs,
    'gameCategoryOptionId'
  >[];
};

@Table({
  tableName: 'game-categories-options-values',
  timestamps: true,
})
export class GameCategoryOptionValue extends Model<
  GameCategoryOptionValue,
  GameCategoryOptionValueCreationAttrs
> {
  @ForeignKey(() => GameCategoryOption)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE' })
  declare gameCategoryOptionId: number;

  @HasMany(() => GameCategoryOptionValueTranslation, { onDelete: 'CASCADE' })
  declare translations: GameCategoryOptionValueTranslation[];
}
