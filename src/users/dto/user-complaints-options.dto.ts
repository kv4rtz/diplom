import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ComplaintUserStatus } from 'src/graphql';

export class UserComplaintsOptionsDto {
  @IsOptional()
  @IsNumber()
  readonly creatorId?: number;

  @IsOptional()
  @IsNumber()
  readonly targetId?: number;

  @IsOptional()
  @IsEnum(ComplaintUserStatus)
  readonly status?: ComplaintUserStatus;

  @IsOptional()
  @IsString()
  readonly order?: string;
}
