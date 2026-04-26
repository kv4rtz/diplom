import { ConfigService } from '@nestjs/config';
import { configDotenv } from 'dotenv';

configDotenv({ quiet: true });

const config = new ConfigService();

export enum StorageBuckets {
  Avatars = config.get('S3_BUCKET_AVATARS'),
  BannersAndIcons = config.get('S3_BUCKET_GAMES_BANNERS_AND_ICONS'),
  Messages = config.get('S3_BUCKET_MESSAGES'),
  Achievements = config.get('S3_BUCKET_ACHIEVEMENTS'),
  Exports = config.get('S3_BUCKET_EXPORTS'),
  Tickets = config.get('S3_BUCKET_TICKETS'),
}

export enum OpenForReadBuckets {
  Avatars = config.get('S3_BUCKET_AVATARS'),
  BannersAndIcons = config.get('S3_BUCKET_GAMES_BANNERS_AND_ICONS'),
  Achievements = config.get('S3_BUCKET_ACHIEVEMENTS'),
}

export const getAllowGetPolicy = (bucket: string) =>
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucket}/*`,
      },
    ],
  });
