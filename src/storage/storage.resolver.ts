import { OnModuleInit } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { GetUploadUrlsDto } from './dto/get-upload-urls.dto';
import { StorageService } from './storage.service';

@Resolver('Storage')
export class StorageResolver implements OnModuleInit {
  constructor(private readonly storageService: StorageService) {}

  onModuleInit() {
    this.storageService.createBuckets();
    this.storageService.allowReadForOpenBuckets();
  }

  @Mutation()
  getUploadUrl(@Args() dto: GetUploadUrlDto) {
    return this.storageService.getUploadUrl(dto.mimeType, dto.bucket);
  }

  @Mutation()
  getUploadUrls(@Args() dto: GetUploadUrlsDto) {
    return this.storageService.getUploadUrls(dto.uploads);
  }
}
