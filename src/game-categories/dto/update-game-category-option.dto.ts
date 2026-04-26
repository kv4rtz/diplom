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

export class UpdateGameCategoryOptionDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  type?: GameOptionType;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GameCategoryOptionValues)
  values?: GameCategoryOptionValues[];

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsNumber()
  rangeMin?: number;

  @IsOptional()
  @IsNumber()
  rangeMax?: number;

  @IsOptional()
  @Translations()
  translations?: GameCategoryOptionsTranslations[];
}
