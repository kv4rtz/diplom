import { Sequelize } from 'sequelize';
import {
  BeforeSync,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { CurrencyValue } from 'src/currencies/models/currency-value.model';
import { Currency, OrderStatus } from 'src/graphql';
import { ProductLot } from 'src/products/models/product-lots.model';
import { User } from 'src/users/models/users.model';
import { generateIdFnPlpgsql } from './generate-id';
import { OrderProductSnapshot } from './order-product-snapshot.model';

export type OrderCreationAttrs = {
  id?: string;
  productSnapshotId: string;
  buyerId: number;
  paymentMethod: string;
  productLotId: number | null;
  status: string;
  price: number;
  currency: Currency;
  priceWithoutCommission: number;
  currencyForPriceWithoutCommission: Currency;
};

@Table({ tableName: 'orders', timestamps: true })
export class Order extends Model<Order, OrderCreationAttrs> {
  @Column({
    type: DataType.STRING(8),
    unique: true,
    primaryKey: true,
    defaultValue: Sequelize.literal("generate_unique_id_for_table('orders')"),
  })
  declare id: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare price: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare priceWithoutCommission: number;

  @Column({
    type: DataType.ENUM(...Object.values(Currency)),
    allowNull: false,
  })
  declare currencyForPriceWithoutCommission: Currency;

  @ForeignKey(() => ProductLot)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare productLotId: number;

  @Column({
    type: DataType.ENUM(...Object.values(Currency)),
    allowNull: false,
  })
  declare currency: Currency;

  @BelongsTo(() => CurrencyValue, {
    foreignKey: 'currency',
    targetKey: 'currency',
    constraints: false,
  })
  declare currencyValue: CurrencyValue;

  @ForeignKey(() => OrderProductSnapshot)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare productSnapshotId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare buyerId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare buyer: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare paymentMethod: string;

  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
    allowNull: false,
  })
  declare status: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isAlreadyReopened: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare waitToReopen: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isPriority: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isProblematic: boolean;

  @BelongsTo(() => OrderProductSnapshot)
  declare productSnapshot: OrderProductSnapshot;

  @BeforeSync
  static async createFnForGenId() {
    await generateIdFnPlpgsql(this.sequelize!);
  }
}
