import { IsString } from 'class-validator';
import { Locale } from 'src/graphql';

export class RoleTranslationDto {
  @IsString()
  locale: Locale;

  @IsString()
  name: string;
}
