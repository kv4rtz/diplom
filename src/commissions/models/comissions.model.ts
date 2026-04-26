import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { ComissionType, Currency } from 'src/graphql';
import {
  ComissionTranslation,
  ComissionTranslationCreationAttrs,
} from './comission-translations.model';

export type ComissionCreationAttrs = {
  translations: Omit<ComissionTranslationCreationAttrs, 'comissionId'>[];
  percentage: number;
  type: ComissionType;
  uniqueId: string;
  currency?: Currency;
};

@Table({
  tableName: 'comissions',
})
export class Comission extends Model<Comission, ComissionCreationAttrs> {
  @Column({ type: DataType.DECIMAL, allowNull: false })
  declare percentage: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare uniqueId: string;

  @Column({
    type: DataType.ENUM(...Object.values(ComissionType)),
    allowNull: false,
  })
  declare type: ComissionType;

  @Column({
    type: DataType.ENUM(...Object.values(Currency)),
    allowNull: true,
  })
  declare currency?: Currency;

  @HasMany(() => ComissionTranslation)
  declare translations: ComissionTranslation[];
}
