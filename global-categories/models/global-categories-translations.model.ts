import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Locale } from 'src/graphql';
import { GlobalCategory } from './global-categories.model';

export type GlobalCategoryTranslationCreationAttrs = {
  globalCategoryId: number;
  locale: Locale;
  name: string;
  description: string;
};

@Table({
  tableName: 'global_categories_translations',
  timestamps: true,
})
export class GlobalCategoryTranslation extends Model<
  GlobalCategoryTranslation,
  GlobalCategoryTranslationCreationAttrs
> {
  @ForeignKey(() => GlobalCategory)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare globalCategoryId: number;

  @BelongsTo(() => GlobalCategory)
  declare globalCategory: GlobalCategory;

  @Column({
    type: DataType.ENUM(...Object.values(Locale)),
    allowNull: false,
  })
  declare locale: Locale;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;
}
