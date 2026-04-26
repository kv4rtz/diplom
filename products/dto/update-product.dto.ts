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

export class UpdateProductDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsNumber()
  gameCategoryId?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  autoDelivery?: boolean;

  @IsOptional()
  @Type(() => ProductOptionDto)
  @ValidateNested({ each: true })
  options?: ProductOptionDto[];

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  deactiveAfterSell?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lots?: string[];

  @IsOptional()
  @Translations()
  translations?: ProductTranslationDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
