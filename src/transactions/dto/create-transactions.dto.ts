import { IsNumber } from 'class-validator';

export class BuyProductFromBalanceDto {
  @IsNumber()
  productId: number;
}
