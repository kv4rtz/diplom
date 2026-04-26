import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ComplaintProductReasons } from 'src/graphql';

export class ComplaintProductDto {
  @IsNumber()
  readonly productId: number;

  @IsEnum(ComplaintProductReasons)
  readonly reason: ComplaintProductReasons;

  @IsString()
  @IsOptional()
  readonly comment?: string;
}
