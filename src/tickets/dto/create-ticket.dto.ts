import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { TicketTopic, TicketTopicCategory } from 'src/graphql';

export class CreateTicketDto {
  @IsEnum(TicketTopic)
  readonly topic: TicketTopic;

  @IsEnum(TicketTopicCategory)
  readonly topicCategory: TicketTopicCategory;

  @IsOptional()
  @IsString()
  readonly comment?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  readonly imagesKeys: string[];

  @IsOptional()
  @IsBoolean()
  readonly notifyAboutResolveByEmail: boolean;
}
