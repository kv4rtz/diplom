import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { Currency } from 'src/graphql';

export type CurrencyValueCreationAttrs = {
  currency: Currency;
  value: number;
};

@Table({
  tableName: 'currency_values',
  timestamps: true,
  indexes: [
    {
      fields: ['currency'],
      unique: true,
    },
  ],
})
export class CurrencyValue extends Model<
  CurrencyValue,
  CurrencyValueCreationAttrs
> {
  @Column({
    type: DataType.ENUM(...Object.values(Currency)),
    allowNull: false,
  })
  declare currency: Currency;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  })
  declare value: number;
}
