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

export class CreateGameCategoryDto {
  @IsOptional()
  @IsBoolean()
  visible: boolean;

  @IsNumber()
  gameId: number;

  @IsNumber()
  globalCategoryId: number;

  @Translations()
  translations: GameCategoryTranslationsDto[];

  @IsNumber()
  productsQuantityByUser: number;

  @IsNumber()
  minOrderPrice: number;

  @IsNumber()
  possiblePercentage: number;

  @IsOptional()
  @IsString()
  commentForBuyer: string;

  @IsOptional()
  @IsNumber()
  discountForBalancePayment: number;

  @IsBoolean()
  allowScreenshotsInProduct: boolean;

  @IsBoolean()
  sellerVerifiedPhone: boolean;

  @IsBoolean()
  sellerVerfiedIdentity: boolean;

  @Type(() => GameCategoryOptionDto)
  @ValidateNested({ each: true })
  options: GameCategoryOptionDto[];
}
