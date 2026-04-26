import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTicketMessageDto {
  @IsNumber()
  readonly ticketId: number;

  @IsString()
  readonly text: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  readonly filesKeys?: string[];
}
