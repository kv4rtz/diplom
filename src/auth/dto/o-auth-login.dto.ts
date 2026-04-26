import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OAuthProvider } from 'src/graphql';

export class OAuthLoginDto {
  @IsEnum(OAuthProvider)
  readonly provider: OAuthProvider;

  @IsString()
  readonly code: string;

  @IsOptional()
  @IsString()
  readonly deviceId: string;

  @IsOptional()
  @IsString()
  readonly originalPKCE: string;
}
