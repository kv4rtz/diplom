import { Module } from '@nestjs/common';
import { configDotenv } from 'dotenv';
import { S3Module } from 'nestjs-s3';
import { StorageResolver } from './storage.resolver';
import { StorageService } from './storage.service';

configDotenv({ quiet: true });

@Module({
  imports: [
    S3Module.forRoot({
      config: {
        credentials: {
          accessKeyId: process.env.S3_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET!,
        },
        region: process.env.S3_REGION!,
        endpoint: process.env.S3_ENDPOINT!,
        forcePathStyle: true,
      },
    }),
  ],
  providers: [StorageResolver, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
