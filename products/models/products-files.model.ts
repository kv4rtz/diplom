import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Product } from './products.model';

export type ProductFileCreationAttrs = {
  productId: number;
  fileKey: string;
};

@Table({
  tableName: 'products_files',
})
export class ProductFile extends Model<ProductFile, ProductFileCreationAttrs> {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare productId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare fileKey: string;
}
