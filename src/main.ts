import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { configDotenv } from 'dotenv';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { SequelizeExceptionFilter } from './global/filters/sequelize-exception.filter';
import { loggerConfig } from './global/logger/logger';
import { exceptionFactory } from './global/validationExceptionFactory';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { MetricsService } from './metrics/metrics.service';

configDotenv({ quiet: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(loggerConfig),
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory,
    }),
  );
  app.useGlobalFilters(new SequelizeExceptionFilter());
  app.useGlobalInterceptors(new MetricsInterceptor(app.get(MetricsService)));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
