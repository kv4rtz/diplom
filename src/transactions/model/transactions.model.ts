import { type FindOptions } from 'sequelize';
import {
  BeforeFind,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Finance } from 'src/finance/models/finance.model';
import { Currency, TransactionType } from 'src/graphql';
import { Order } from 'src/orders/models/orders.model';

export type TransactionCreationAttrs = {
  financeId: number;
  amount: number;
  currency: Currency;
  type: TransactionType;
  orderId?: string;
  metadata?: Record<string, any>;
  isHidden?: boolean;
};

@Table({
  tableName: 'transactions',
  timestamps: true,
  paranoid: true,
})
export class Transaction extends Model<Transaction, TransactionCreationAttrs> {
  @ForeignKey(() => Finance)
  @Column({
    type: DataType.INTEGER,
  })
  declare financeId: number;

  @BelongsTo(() => Finance)
  declare finance: Finance;

  @Column({
    type: DataType.DECIMAL(10, 2),
  })
  declare amount: number;

  @Column({
    type: DataType.ENUM(...Object.values(Currency)),
  })
  declare currency: Currency;

  @Column({
    type: DataType.ENUM(...Object.values(TransactionType)),
  })
  declare type: TransactionType;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.STRING,
  })
  declare orderId?: string;

  @BelongsTo(() => Order)
  declare order?: Order;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare metadata?: Record<string, any>;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isHidden: boolean;

  @BeforeFind
  static beforeFindHook(options: FindOptions<Transaction>) {
    if (typeof (options?.where as any)?.isHidden !== 'boolean') {
      if (options.where) {
        (options.where as any).isHidden = false;
      } else {
        options.where = {
          isHidden: false,
        };
      }
    }
  }
}
