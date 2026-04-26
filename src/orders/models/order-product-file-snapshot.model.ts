import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { OrderProductSnapshot } from './order-product-snapshot.model';

export type OrderProductFileSnapshotCreationAttrs = {
  orderProductSnapshotId: string;
  fileKey: string;
};

@Table({
  tableName: 'order_product_file_snapshots',
  timestamps: false,
})
export class OrderProductFileSnapshot extends Model<
  OrderProductFileSnapshot,
  OrderProductFileSnapshotCreationAttrs
> {
  @ForeignKey(() => OrderProductSnapshot)
  @Column({ type: DataType.STRING, allowNull: false })
  declare orderProductSnapshotId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare fileKey: string;
}
