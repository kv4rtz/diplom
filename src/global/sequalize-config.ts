import { NotFoundException } from '@nestjs/common';
import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from '@nestjs/sequelize';
import { configDotenv } from 'dotenv';
import { SyncOptions } from 'sequelize';
import { ErrorCause } from 'src/errors-couse';

configDotenv({ quiet: true });

export class SequalizeConfig implements SequelizeOptionsFactory {
  createSequelizeOptions(
    connectionName?: string,
  ): Promise<SequelizeModuleOptions> | SequelizeModuleOptions {
    let sync: SyncOptions = {};
    if (process.env.DB_SYNC === 'alter') {
      sync = { alter: true };
    } else if (process.env.DB_SYNC === 'force') {
      sync = { force: true };
    }

    return {
      dialect: 'postgres' as const,
      host: 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      synchronize: process.env.DB_SYNC ? true : false,
      sync,
      autoLoadModels: true,
      logging: false,
      hooks: {
        afterFind: (instance, options) => {
          if (!instance) throw new NotFoundException(ErrorCause.NOT_FOUND);
        },
      },
    };
  }
}
