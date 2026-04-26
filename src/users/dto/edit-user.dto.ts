import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Currency, Locale } from 'src/graphql';

export class EditUserDto {
  @IsOptional()
  @IsString()
  readonly login?: string;

  @IsOptional()
  @IsEnum(Locale)
  readonly locale?: Locale;

  @IsOptional()
  @IsEnum(Currency)
  readonly currency?: Currency;

  @IsOptional()
  @IsString()
  readonly avatar?: string;
}
