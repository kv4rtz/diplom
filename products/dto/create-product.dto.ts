import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Translations } from 'src/global/decorators/translation-validator.decorator';
import { ProductOptionDto } from './product-option.dto';
import { ProductTranslationDto } from './product-translation.dto';

export class CreateProductDto {
  @IsNumber()
  gameCategoryId: number;

  @IsNumber()
  price: number;

  @IsBoolean()
  autoDelivery: boolean;

  @Type(() => ProductOptionDto)
  @ValidateNested({ each: true })
  options: ProductOptionDto[];

  @Translations()
  translations: ProductTranslationDto[];

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsBoolean()
  deactiveAfterSell: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lots: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images: string[];
}
