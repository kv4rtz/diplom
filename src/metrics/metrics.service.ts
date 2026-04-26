import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('graphql_requests_total')
    private readonly requestsCounter: Counter<'operation'>,

    @InjectMetric('graphql_request_duration_seconds')
    private readonly requestDuration: Histogram<'operation'>,
  ) {}

  incrementRequests(operation: string) {
    this.requestsCounter.inc({ operation });
  }

  startTimer() {
    return this.requestDuration.startTimer();
  }
}
