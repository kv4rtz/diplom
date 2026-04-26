import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SuggestedGameCategoryCreateDto {
  @IsNumber()
  gameId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
