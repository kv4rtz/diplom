import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { GameCategory } from 'src/game-categories/models/game-categories.model';
import { Currency } from 'src/graphql';
import { OrderProductSnapshot } from 'src/orders/models/order-product-snapshot.model';
import { Review } from 'src/reviews/reviews.model';
import { User } from 'src/users/models/users.model';
import { ProductLot } from './product-lots.model';
import {
  ProductOption,
  ProductOptionCreationAttrs,
} from './product-options.model';
import {
  ProductTranslation,
  ProductTranslationCreationAttrs,
} from './product-translations.model';
import { ProductView } from './product-views.model';
import { ProductFile } from './products-files.model';

export type ProductCreationAttrs = {
  gameCategoryId: number;
  sellerId: number;
  price: number;
  autoDelivery: boolean;
  options: Omit<ProductOptionCreationAttrs, 'productId'>[];
  translations: Omit<ProductTranslationCreationAttrs, 'productId'>[];
  currency?: Currency;
  slug: string;
};

@Table({
  tableName: 'products',
  timestamps: true,
  paranoid: true,
})
export class Product extends Model<Product, ProductCreationAttrs> {
  @ForeignKey(() => GameCategory)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare gameCategoryId: number;

  @BelongsTo(() => GameCategory)
  declare gameCategory: GameCategory;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare sellerId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare seller: User;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare slug: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @Column({
    type: DataType.ENUM(...Object.values(Currency)),
    allowNull: false,
    defaultValue: Currency.RUB,
  })
  declare currency: Currency;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare autoDelivery: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare active: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare deactiveAfterSell: boolean;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare quantity: number;

  @HasMany(() => ProductOption)
  declare options: ProductOption[];

  @HasMany(() => ProductTranslation)
  declare translations: ProductTranslation[];

  @HasMany(() => ProductFile)
  declare filesKeys: ProductFile[];

  @HasMany(() => ProductView)
  declare views: ProductView[];

  @HasMany(() => Review)
  declare reviews: Review[];

  @HasMany(() => OrderProductSnapshot)
  declare orderProductSnapshots: OrderProductSnapshot[];

  @HasMany(() => ProductLot)
  declare lots: ProductLot[];

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastLiftingAt: Date | null;
}
