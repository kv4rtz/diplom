import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Translations } from 'src/global/decorators/translation-validator.decorator';
import { GlobalCategoryType } from 'src/graphql';
import { GlobalCategoryTranslationDto } from './global-category-translation.dto';

export class CreateGlobalCategoryDto {
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @Translations()
  translations: GlobalCategoryTranslationDto[];

  @IsEnum(GlobalCategoryType)
  type: GlobalCategoryType;
}
