import { IsOptional } from 'class-validator';

export class PageInfoDto {
  @IsOptional()
  limit?: number;

  @IsOptional()
  page?: number;
}
