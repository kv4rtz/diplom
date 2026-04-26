import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Translations } from 'src/global/decorators/translation-validator.decorator';
import { GameType } from 'src/graphql';
import { GameTranslationDto } from './game-translation.dto';

export class CreateGameDto {
  @Translations()
  translations: GameTranslationDto[];

  @IsEnum(GameType)
  type: GameType;

  @IsOptional()
  visible?: boolean;

  @IsString()
  iconKey: string;

  @IsString()
  bannerKey: string;

  @IsOptional()
  hideMainSection?: boolean;

  @IsOptional()
  haveChat?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  searches?: string[];
}
