import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateReviewDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @Min(1)
  @Max(5)
  speedRating: number;

  @IsOptional()
  @Min(1)
  @Max(5)
  qualityRating: number;

  @IsOptional()
  @Min(1)
  @Max(5)
  accordanceRating: number;

  @IsOptional()
  @Min(1)
  @Max(5)
  communicationRating: number;

  @IsOptional()
  @Min(1)
  @Max(5)
  recommendationRating: number;

  @IsOptional()
  @Min(1)
  @Max(5)
  generalRating: number;

  @IsOptional()
  @IsString()
  text?: string;
}

export class UpdateReviewAnswerDto {
  @IsNumber()
  id: number;

  @IsString()
  @MinLength(3)
  text: string;
}
