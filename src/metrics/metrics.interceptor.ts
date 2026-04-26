import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlCtx = GqlExecutionContext.create(context);
    const info = gqlCtx.getInfo();

    const parentType = info.parentType?.name;
    const fieldName = info.fieldName;

    if (!parentType || !fieldName) {
      return next.handle();
    }

    const operationName = `${parentType}.${fieldName}`;

    this.metrics.incrementRequests(operationName);

    const end = this.metrics.startTimer();

    return next.handle().pipe(
      tap(() => {
        end({ operation: operationName });
      }),
    );
  }
}
