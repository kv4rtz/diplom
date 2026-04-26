import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/models/users.model';
import { Product } from './products.model';

export type ProductFavouriteCreationAttrs = {
  productId: number;
  userId: number;
};

@Table({
  tableName: 'product_favourites',
  indexes: [{ unique: true, fields: ['productId', 'userId'] }],
})
export class ProductFavourite extends Model<
  ProductFavourite,
  ProductFavouriteCreationAttrs
> {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare productId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;
}
