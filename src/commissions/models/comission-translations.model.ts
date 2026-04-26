import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Locale } from 'src/graphql';
import { Comission } from './comissions.model';

export type ComissionTranslationCreationAttrs = {
  comissionId: number;
  locale: Locale;
  method: string;
};

@Table({
  tableName: 'comission_translations',
})
export class ComissionTranslation extends Model<
  ComissionTranslation,
  ComissionTranslationCreationAttrs
> {
  @ForeignKey(() => Comission)
  @Column({ type: DataType.INTEGER })
  declare comissionId: number;

  @Column({ type: DataType.ENUM(...Object.values(Locale)) })
  declare locale: Locale;

  @Column({ type: DataType.STRING })
  declare method: string;
}
