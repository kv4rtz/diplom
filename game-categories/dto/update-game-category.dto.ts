import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Translations } from 'src/global/decorators/translation-validator.decorator';
import { GameCategoryOptionDto } from './game-category-option.dto';
import { GameCategoryTranslationsDto } from './game-category-translations.dto';

export class UpdateGameCategoryDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsNumber()
  gameId?: number;

  @IsOptional()
  @IsNumber()
  discountForBalancePayment: number;

  @IsOptional()
  @IsNumber()
  globalCategoryId?: number;

  @IsOptional()
  @IsNumber()
  productsQuantityByUser?: number;

  @IsOptional()
  @IsNumber()
  minOrderPrice?: number;

  @IsOptional()
  @IsNumber()
  possiblePercentage?: number;

  @IsOptional()
  @IsString()
  commentForBuyer?: string;

  @IsOptional()
  @IsBoolean()
  allowScreenshotsInProduct?: boolean;

  @IsOptional()
  @IsBoolean()
  sellerVerifiedPhone?: boolean;

  @IsOptional()
  @IsBoolean()
  sellerVerfiedIdentity?: boolean;

  @IsOptional()
  @Translations()
  translations?: GameCategoryTranslationsDto[];

  @IsOptional()
  @Type(() => GameCategoryOptionDto)
  @ValidateNested({ each: true })
  options?: GameCategoryOptionDto[];
}
