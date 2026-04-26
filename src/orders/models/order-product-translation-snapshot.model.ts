import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Locale } from 'src/graphql';
import { OrderProductSnapshot } from './order-product-snapshot.model';

export type OrderProductTranslationSnapshotCreationAttrs = {
  orderProductSnapshotId: string;
  locale: string;
  name: string;
  description: string;
  messageForBuyer?: string;
};

@Table({
  tableName: 'order_product_translation_snapshots',
  timestamps: false,
})
export class OrderProductTranslationSnapshot extends Model<
  OrderProductTranslationSnapshot,
  OrderProductTranslationSnapshotCreationAttrs
> {
  @ForeignKey(() => OrderProductSnapshot)
  @Column({ type: DataType.STRING, allowNull: false })
  declare orderProductSnapshotId: string;

  @BelongsTo(() => OrderProductSnapshot)
  declare orderProductSnapshot: OrderProductSnapshot;

  @Column({
    type: DataType.ENUM(...Object.values(Locale)),
    allowNull: false,
  })
  declare locale: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare messageForBuyer?: string;
}
