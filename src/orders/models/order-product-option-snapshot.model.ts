import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { GameCategoryOption } from 'src/game-categories/models/game-categories-options.model';
import { OrderProductSnapshot } from './order-product-snapshot.model';

export type OrderProductOptionSnapshotCreationAttrs = {
  orderProductSnapshotId: string;
  gameCategoryOptionId: number;
  value: string;
};

@Table({
  tableName: 'order_product_option_snapshots',
  timestamps: false,
})
export class OrderProductOptionSnapshot extends Model<
  OrderProductOptionSnapshot,
  OrderProductOptionSnapshotCreationAttrs
> {
  @ForeignKey(() => OrderProductSnapshot)
  @Column({ type: DataType.STRING, allowNull: false })
  declare orderProductSnapshotId: string;

  @ForeignKey(() => GameCategoryOption)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare gameCategoryOptionId: number;

  // Зафиксированное значение на момент покупки
  @Column({ type: DataType.STRING, allowNull: false })
  declare value: string;

  @BelongsTo(() => OrderProductSnapshot)
  declare orderProductSnapshot: OrderProductSnapshot;

  @BelongsTo(() => GameCategoryOption)
  declare gameCategoryOption: GameCategoryOption;
}
