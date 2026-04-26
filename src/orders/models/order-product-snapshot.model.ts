import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { GameCategory } from 'src/game-categories/models/game-categories.model';
import { Currency } from 'src/graphql';
import { Order } from 'src/orders/models/orders.model';
import { Product } from 'src/products/models/products.model';
import { User } from 'src/users/models/users.model';

export type OrderProductSnapshotCreationAttrs = {
  orderId: string;
  originalProductId: number;
  gameCategoryId: number;
  sellerId: number;
  slug: string;
  price: number;
  currency: Currency;
  autoDelivery: boolean;
  active: boolean;
  deactiveAfterSell: boolean;
  quantity: number;
  lastLiftingAt: Date | null;
};

@Table({
  tableName: 'order_product_snapshots',
  timestamps: false,
})
export class OrderProductSnapshot extends Model<
  OrderProductSnapshot,
  OrderProductSnapshotCreationAttrs
> {
  @ForeignKey(() => Order)
  @Column({ type: DataType.STRING, allowNull: false, primaryKey: true })
  declare orderId: string;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare originalProductId: number;

  @ForeignKey(() => GameCategory)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare gameCategoryId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare sellerId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare seller: User;

  @Column({ type: DataType.STRING, allowNull: false })
  declare slug: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @Column({
    type: DataType.ENUM(...Object.values(Currency)),
    allowNull: false,
  })
  declare currency: Currency;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare autoDelivery: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare active: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare deactiveAfterSell: boolean;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare quantity: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastLiftingAt: Date | null;

  @BelongsTo(() => Order)
  declare order: Order;

  @BelongsTo(() => Product)
  declare originalProduct: Product;
}
