import KeyvRedis from '@keyv/redis';
import { CacheOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { configDotenv } from 'dotenv';

configDotenv({ quiet: true });

export class CacheConfig implements CacheOptionsFactory {
  createCacheOptions(): Promise<CacheOptions> | CacheOptions {
    return {
      stores: [
        new KeyvRedis(
          `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        ),
      ],
    };
  }
}
