import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { GameCategory } from 'src/game-categories/models/game-categories.model';
import { GlobalCategoryType } from 'src/graphql';
import {
  GlobalCategoryTranslation,
  GlobalCategoryTranslationCreationAttrs,
} from './global-categories-translations.model';

export type GlobalCategoryCreationAttrs = {
  slug: string;
  visible: boolean;
  type: GlobalCategoryType;
  translations: Omit<
    GlobalCategoryTranslationCreationAttrs,
    'globalCategoryId'
  >[];
};

@Table({
  tableName: 'global_categories',
  timestamps: true,
})
export class GlobalCategory extends Model<
  GlobalCategory,
  GlobalCategoryCreationAttrs
> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare visible: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(GlobalCategoryType)),
    defaultValue: GlobalCategoryType.products,
  })
  declare type: GlobalCategoryType;

  @HasMany(() => GlobalCategoryTranslation)
  declare translations: GlobalCategoryTranslation[];

  @HasMany(() => GameCategory)
  declare gameCategories: GameCategory[];
}
