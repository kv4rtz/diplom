import { Op } from 'sequelize';
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

@Table({
  tableName: 'product_views',
  indexes: [
    {
      name: 'uniq_product_ip_when_user_null',
      unique: true,
      fields: ['productId', 'ip'],
      where: {
        userId: null,
      },
    },
    {
      name: 'uniq_product_user_when_user_not_null',
      unique: true,
      fields: ['productId', 'userId'],
      where: {
        userId: {
          [Op.ne]: null,
        },
      },
    },
  ],
})
export class ProductView extends Model {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
  declare productId: number;

  @BelongsTo(() => Product)
  declare product: Product;

  @Column({ type: DataType.STRING, allowNull: false })
  declare ip: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare userId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;
}
