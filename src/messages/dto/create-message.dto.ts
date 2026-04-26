import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  readonly text?: string;

  @IsNumber()
  readonly chatId: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly files?: string[];
}
