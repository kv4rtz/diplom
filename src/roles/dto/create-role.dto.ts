import { IsString } from 'class-validator';
import { Translations } from 'src/global/decorators/translation-validator.decorator';
import { RoleTranslationDto } from './role-translation.dto';

export class CreateRoleDto {
  @IsString()
  code: string;

  @Translations()
  translations: RoleTranslationDto[];

  permissions?: number[];
}
