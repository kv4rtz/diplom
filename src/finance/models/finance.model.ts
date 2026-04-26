import { Column, DataType, Model, Table } from 'sequelize-typescript';

export type FinanceCreationAttrs = {
  userId: number;
};

@Table({
  tableName: 'finances',
  timestamps: true,
})
export class Finance extends Model<Finance, FinanceCreationAttrs> {
  @Column({ type: DataType.INTEGER })
  declare userId: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare rub: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare usd: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare eur: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare bonuses: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare hiddenBalanceInRub: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare securityDeposit: number;
}
