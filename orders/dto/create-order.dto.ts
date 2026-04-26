import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @IsOptional()
  paymentMethod: string;

  id?: string;
}
