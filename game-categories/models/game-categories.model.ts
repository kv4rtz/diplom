import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Game } from 'src/games/models/games.model';
import { GlobalCategory } from 'src/global-categories/models/global-categories.model';
import { Product } from 'src/products/models/products.model';
import { GameCategoryOption } from './game-categories-options.model';
import {
  GameCategoryTranslation,
  GameCategoryTranslationCreationAttrs,
} from './game-categories-translations.model';

export type GameCategoryCreationAttrs = {
  slug: string;
  visible: boolean;
  gameId: number;
  globalCategoryId?: number;
  translations: Omit<GameCategoryTranslationCreationAttrs, 'gameCategoryId'>[];
  productsQuantityByUser: number;
  minOrderPrice: number;
  possiblePercentage: number;
  commentForBuyer: string;
  allowScreenshotsInProduct: boolean;
  sellerVerifiedPhone: boolean;
  sellerVerfiedIdentity: boolean;
};

@Table({
  tableName: 'game_categories',
  timestamps: true,
})
export class GameCategory extends Model<
  GameCategory,
  GameCategoryCreationAttrs
> {
  @Column({ type: DataType.STRING })
  declare slug: string;

  @Column({ type: DataType.BOOLEAN })
  declare visible: boolean;

  @ForeignKey(() => Game)
  @Column({ type: DataType.INTEGER })
  declare gameId: number;

  @Column({ type: DataType.INTEGER })
  declare productsQuantityByUser: number;

  @Column({ type: DataType.DECIMAL(10, 2) })
  declare minOrderPrice: number;

  @Column({ type: DataType.DECIMAL(10, 2) })
  declare possiblePercentage: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 1 })
  declare discountForBalancePayment: number;

  @Column({ type: DataType.TEXT })
  declare commentForBuyer: string;

  @Column({ type: DataType.BOOLEAN })
  declare allowScreenshotsInProduct: boolean;

  @Column({ type: DataType.BOOLEAN })
  declare sellerVerifiedPhone: boolean;

  @Column({ type: DataType.BOOLEAN })
  declare sellerVerfiedIdentity: boolean;

  @BelongsTo(() => Game)
  declare game: Game;

  @ForeignKey(() => GlobalCategory)
  @Column({ type: DataType.INTEGER })
  declare globalCategoryId: number;

  @BelongsTo(() => GlobalCategory)
  declare globalCategory: GlobalCategory;

  @HasMany(() => Product)
  declare products: Product[];

  @HasMany(() => GameCategoryTranslation)
  declare translations: GameCategoryTranslation[];

  @HasMany(() => GameCategoryOption)
  declare options: GameCategoryOption[];
}
