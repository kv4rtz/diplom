import { IsNumber, IsString } from 'class-validator';

export class ProductOptionDto {
  @IsNumber()
  readonly gameCategoryOptionId: number;

  @IsString()
  readonly value: string;
}
