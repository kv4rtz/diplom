import { IsEnum, IsMimeType } from 'class-validator';
import { getEnumValues } from 'src/global/utils/getEnumValues';
import { StorageBuckets } from '../buckets.enum';

export class GetUploadUrlDto {
  @IsMimeType()
  mimeType: string;

  @IsEnum(getEnumValues(StorageBuckets))
  bucket: StorageBuckets;
}
