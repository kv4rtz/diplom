import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import { ComplaintProductReasons, ComplaintProductStatus } from 'src/graphql';
import { User } from 'src/users/models/users.model';
import { Product } from './products.model';

export type ProductComplaintsCreationAttrs = {
  productId: number;
  userId: number;
  reason: ComplaintProductReasons;
  comment?: string;
};

@Table({ tableName: 'product_complaints' })
export class ProductComplaint extends Model<
  ProductComplaint,
  ProductComplaintsCreationAttrs
> {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER })
  declare productId: number;

  @BelongsTo(() => Product)
  declare product: Product;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @Column({ type: DataType.ENUM(...Object.values(ComplaintProductReasons)) })
  declare reason: ComplaintProductReasons;

  @Column({
    type: DataType.ENUM(...Object.values(ComplaintProductStatus)),
    defaultValue: ComplaintProductStatus.PENDING,
  })
  declare status: ComplaintProductStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare comment: string;
}
