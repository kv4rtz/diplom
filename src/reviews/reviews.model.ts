import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { ReviewType } from 'src/graphql';
import { Order } from 'src/orders/models/orders.model';
import { Product } from 'src/products/models/products.model';
import { User } from 'src/users/models/users.model';

export type ReviewCreationAttrs = {
  type: ReviewType;
  speedRating: number;
  qualityRating: number;
  accordanceRating: number;
  communicationRating: number;
  recommendationRating: number;
  generalRating: number;
  text: string;
  userId: number;
  productId?: number;
  orderId?: string;
  reviewId?: number;
};

export const ratingWeight = {
  5: 1,
  4: 1,
  3: 0.8,
  2: 0.4,
  1: 0.4,
};

@Table({
  tableName: 'reviews',
  timestamps: true,
})
export class Review extends Model<Review, ReviewCreationAttrs> {
  @Column({ type: DataType.ENUM(...Object.values(ReviewType)) })
  declare type: ReviewType;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      const ratings = [
        this.getDataValue('speedRating'),
        this.getDataValue('qualityRating'),
        this.getDataValue('accordanceRating'),
        this.getDataValue('communicationRating'),
        this.getDataValue('recommendationRating'),
        this.getDataValue('generalRating'),
      ];
      const sum = ratings.reduce((acc, rating) => acc + rating, 0);
      return Number((sum / ratings.length).toFixed(2));
    },
  })
  declare rating: number;

  @Column({ type: DataType.SMALLINT })
  declare speedRating: number;

  @Column({ type: DataType.SMALLINT })
  declare qualityRating: number;

  @Column({ type: DataType.SMALLINT })
  declare accordanceRating: number;

  @Column({ type: DataType.SMALLINT })
  declare communicationRating: number;

  @Column({ type: DataType.SMALLINT })
  declare recommendationRating: number;

  @Column({ type: DataType.SMALLINT })
  declare generalRating: number;

  @Column({ type: DataType.TEXT })
  declare text: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER })
  declare productId: number;

  @BelongsTo(() => Product)
  declare product: Product;

  @ForeignKey(() => Order)
  @Column({ type: DataType.STRING(8) })
  declare orderId?: string;

  @BelongsTo(() => Order)
  declare order: Order;

  @ForeignKey(() => Review)
  @Column({ type: DataType.INTEGER })
  declare reviewId: number;

  @BelongsTo(() => Review)
  declare replyTo: Review;

  @HasOne(() => Review, 'reviewId')
  declare sellerAnswer: Review;
}
