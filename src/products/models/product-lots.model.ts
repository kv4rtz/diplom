import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Product } from './products.model';

export type ProductLotCreationAttrs = {
  productId: number;
  text: string;
};

@Table({ tableName: 'product_lots', paranoid: true, timestamps: true })
export class ProductLot extends Model<ProductLot, ProductLotCreationAttrs> {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER })
  declare productId: number;

  @Column({ type: DataType.TEXT })
  declare text: string;
}
