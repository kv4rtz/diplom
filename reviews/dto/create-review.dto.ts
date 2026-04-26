import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ReviewType } from 'src/graphql';

export class CreateReviewDto {
  @IsEnum(ReviewType)
  type: ReviewType;

  @Min(1)
  @Max(5)
  speedRating: number;

  @Min(1)
  @Max(5)
  qualityRating: number;

  @Min(1)
  @Max(5)
  accordanceRating: number;

  @Min(1)
  @Max(5)
  communicationRating: number;

  @Min(1)
  @Max(5)
  recommendationRating: number;

  @Min(1)
  @Max(5)
  generalRating: number;

  @IsString()
  text: string;

  @IsOptional()
  @IsNumber()
  productId?: number;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  orderId?: string;
}

export class CreateReviewAnswerDto {
  @IsNumber()
  reviewId: number;

  @IsString()
  @MinLength(3)
  text: string;
}
