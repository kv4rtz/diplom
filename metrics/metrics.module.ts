import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { MetricsService } from './metrics.service';

const requestsTotalProvider = {
  provide: 'PROM_METRIC_GRAPHQL_REQUESTS_TOTAL',
  useValue: new Counter({
    name: 'graphql_requests_total',
    help: 'Total number of GraphQL requests',
    labelNames: ['operation'],
  }),
};

const requestDurationProvider = {
  provide: 'PROM_METRIC_GRAPHQL_REQUEST_DURATION_SECONDS',
  useValue: new Histogram({
    name: 'graphql_request_duration_seconds',
    help: 'Duration of GraphQL requests in seconds',
    labelNames: ['operation'],
    buckets: [0.1, 0.5, 1, 2, 5],
  }),
};

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [MetricsService, requestsTotalProvider, requestDurationProvider],
  exports: [MetricsService],
})
export class MetricsModule {}
