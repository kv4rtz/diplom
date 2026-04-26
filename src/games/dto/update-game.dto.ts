import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Translations } from 'src/global/decorators/translation-validator.decorator';
import { GameType } from 'src/graphql';
import { GameTranslationDto } from './game-translation.dto';

export class UpdateGameDto {
  id: number;

  @IsOptional()
  @Translations()
  translations: GameTranslationDto[];

  @IsOptional()
  @IsEnum(GameType)
  type: GameType;

  @IsOptional()
  visible?: boolean;

  @IsOptional()
  iconKey?: string;

  @IsOptional()
  bannerKey?: string;

  @IsOptional()
  hideMainSection?: boolean;

  @IsOptional()
  haveChat?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  searches?: string[];
}
