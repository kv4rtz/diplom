import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Translations } from 'src/global/decorators/translation-validator.decorator';
import { GlobalCategoryType } from 'src/graphql';
import { GlobalCategoryTranslationDto } from './global-category-translation.dto';

export class UpdateGlobalCategoryDto {
  id: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @Translations()
  translations?: GlobalCategoryTranslationDto[];

  @IsOptional()
  @IsEnum(GlobalCategoryType)
  type?: GlobalCategoryType;
}
