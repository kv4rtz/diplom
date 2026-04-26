import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Locale } from 'src/graphql';
import { Product } from './products.model';

export type ProductTranslationCreationAttrs = {
  productId: number;
  locale: string;
  name: string;
  description: string;
};

@Table({
  tableName: 'product_translations',
})
export class ProductTranslation extends Model<
  ProductTranslation,
  ProductTranslationCreationAttrs
> {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare productId: number;

  @Column({ type: DataType.ENUM(...Object.values(Locale)), allowNull: false })
  declare locale: string;

  @Column({ type: DataType.STRING })
  declare name: string;

  @Column({ type: DataType.TEXT })
  declare description: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare messageForBuyer?: string;
}
