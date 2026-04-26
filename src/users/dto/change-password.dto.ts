import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { UserCodeType } from 'src/graphql';

export class ChangePasswordDto {
  @IsString()
  readonly login: string;

  @MinLength(6)
  @MaxLength(6)
  readonly code: string;

  @IsString()
  @MinLength(6)
  readonly password: string;

  @IsString()
  @IsEnum(UserCodeType)
  readonly type: UserCodeType;
}
