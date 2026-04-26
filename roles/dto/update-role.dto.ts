import { IsOptional, IsString } from 'class-validator';
import { Translations } from 'src/global/decorators/translation-validator.decorator';
import { RoleTranslationDto } from './role-translation.dto';

export class UpdateRoleDto {
  id: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @Translations()
  translations?: RoleTranslationDto[];

  permissions?: number[];
}
