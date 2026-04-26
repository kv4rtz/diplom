import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ComplaintProductStatus } from 'src/graphql';

export class ProductComplaintsOptionsDto {
  @IsNumber()
  @IsOptional()
  readonly productId?: number;

  @IsEnum(ComplaintProductStatus)
  @IsOptional()
  readonly status?: ComplaintProductStatus;

  @IsNumber()
  @IsOptional()
  readonly userId?: number;

  @IsNumber()
  @IsOptional()
  readonly sellerId?: number;

  @IsString()
  @IsOptional()
  readonly order?: string;
}
