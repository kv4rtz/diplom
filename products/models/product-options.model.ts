import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { GameCategoryOption } from 'src/game-categories/models/game-categories-options.model';
import { Product } from './products.model';

export type ProductOptionCreationAttrs = {
  gameCategoryOptionId: number;
  productId: number;
  value: string;
};

@Table({
  tableName: 'product_options',
})
export class ProductOption extends Model<
  ProductOption,
  ProductOptionCreationAttrs
> {
  @ForeignKey(() => GameCategoryOption)
  @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
  declare gameCategoryOptionId: number;

  @BelongsTo(() => GameCategoryOption)
  declare gameCategoryOption: GameCategoryOption;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare productId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare value: string;
}
