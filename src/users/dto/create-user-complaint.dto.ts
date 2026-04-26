import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { UserComplaintReason } from 'src/graphql';

export class CreateUserComplaintDto {
  @IsNumber()
  readonly targetId: number;

  @IsEnum(UserComplaintReason)
  readonly reason: UserComplaintReason;

  @IsOptional()
  @IsString()
  readonly comment?: string;
}
