import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateMessageDto {
  @IsNumber()
  readonly id: number;

  @IsString()
  @IsOptional()
  readonly text?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly files?: string[];
}
