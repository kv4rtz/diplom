import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ReviewType } from 'src/graphql';

export class GetReviewsDto {
  @IsOptional()
  @IsNumber()
  sellerId?: number;

  @IsOptional()
  @IsNumber()
  productId?: number;

  @IsOptional()
  @IsEnum(ReviewType)
  type?: ReviewType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  score?: number;

  @IsOptional()
  @IsNumber()
  gameId?: number;

  @IsOptional()
  @IsNumber()
  gameCategoryId?: number;

  @IsOptional()
  @IsString()
  order?: string;
}
