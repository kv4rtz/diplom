import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Translations } from 'src/global/decorators/translation-validator.decorator';
import { GameOptionType } from 'src/graphql';
import { GameCategoryOptionsTranslations } from './game-category-option-translations.dto';
import { GameCategoryOptionValues } from './game-category-option-values.dto';

export class AddGameCategoryOptionDto {
  @IsNumber()
  gameCategoryId: number;

  @IsString()
  type: GameOptionType;

  @IsBoolean()
  isRequired: boolean;

  @Translations()
  translations: GameCategoryOptionsTranslations[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GameCategoryOptionValues)
  values?: GameCategoryOptionValues[];

  @IsOptional()
  @IsNumber()
  rangeMin?: number;

  @IsOptional()
  @IsNumber()
  rangeMax?: number;
}
