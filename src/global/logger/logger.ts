import ecsFormat from '@elastic/ecs-winston-format';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModuleOptions,
} from 'nest-winston';
import winston from 'winston';
import {
  ElasticsearchTransport,
  ElasticsearchTransportOptions,
} from 'winston-elasticsearch';

const esTransportOpts: ElasticsearchTransportOptions = {
  level: 'info',
  clientOpts: {
    node: 'http://localhost:9200',
  },
  indexPrefix: 'nestjs-logs',
  waitForActiveShards: 1,
  format: ecsFormat(),
};

export const loggerConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: nestWinstonModuleUtilities.format.nestLike(),
    }),
    new ElasticsearchTransport(esTransportOpts),
  ],
};
