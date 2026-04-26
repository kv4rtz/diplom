import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetAchievementsDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsBoolean()
  onlyPinned?: boolean;
}
