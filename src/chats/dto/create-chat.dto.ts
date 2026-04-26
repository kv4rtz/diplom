import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsNumber()
  readonly member: number;

  @IsOptional()
  @IsString()
  readonly name?: string;
}
