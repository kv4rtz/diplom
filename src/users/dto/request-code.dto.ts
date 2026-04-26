import { IsEnum, IsString } from 'class-validator';
import { UserCodeType } from 'src/graphql';

export class RequestCodeDto {
  @IsString()
  readonly login: string;

  @IsEnum(UserCodeType)
  readonly type: UserCodeType;
}
