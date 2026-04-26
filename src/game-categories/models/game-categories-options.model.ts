import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { GameOptionType } from 'src/graphql';
import { ProductOption } from 'src/products/models/product-options.model';
import {
  GameCategoryOptionTranslation,
  GameCategoryOptionTranslationCreationAttrs,
} from './game-categories-options-translations.model';
import { GameCategoryOptionValueTranslationCreationAttrs } from './game-categories-options-values-translations.model';
import { GameCategoryOptionValue } from './game-categories-options-values.model';
import { GameCategory } from './game-categories.model';

export class GameCategoryOptionCreationAttrs {
  type: GameOptionType;
  values?: Omit<
    GameCategoryOptionValueTranslationCreationAttrs,
    'gameCategoryOptionId'
  >;
  rangeMin?: number;
  rangeMax?: number;
  gameCategoryId: number;
  isRequired: boolean;
  translations: Omit<
    GameCategoryOptionTranslationCreationAttrs,
    'gameCategoryOptionId'
  >[];
}

@Table({
  tableName: 'game_category_options',
  timestamps: true,
})
export class GameCategoryOption extends Model<
  GameCategoryOption,
  GameCategoryOptionCreationAttrs
> {
  @Column({ type: DataType.ENUM(...Object.values(GameOptionType)) })
  declare type: GameOptionType;

  @Column({ type: DataType.BOOLEAN })
  declare isRequired: boolean;

  @Column({ type: DataType.INTEGER })
  declare rangeMin: number;

  @Column({ type: DataType.INTEGER })
  declare rangeMax: number;

  @HasMany(() => GameCategoryOptionValue, { onDelete: 'CASCADE' })
  declare values: GameCategoryOptionValue[];

  @ForeignKey(() => GameCategory)
  @Column({ type: DataType.INTEGER })
  declare gameCategoryId: number;

  @BelongsTo(() => GameCategory)
  declare gameCategory: GameCategory;

  @HasMany(() => GameCategoryOptionTranslation, { onDelete: 'CASCADE' })
  declare translations: GameCategoryOptionTranslation[];

  @HasMany(() => ProductOption, { onDelete: 'CASCADE' })
  declare productOptions: ProductOption[];
}
