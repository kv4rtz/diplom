import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { GetUploadUrlDto } from './get-upload-url.dto';

export class GetUploadUrlsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GetUploadUrlDto)
  uploads: GetUploadUrlDto[];
}
