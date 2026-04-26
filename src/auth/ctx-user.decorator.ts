import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CtxUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    switch (ctx.getType() as 'http' | 'ws' | 'graphql') {
      case 'http':
        return ctx.switchToHttp().getRequest().user;
      case 'ws':
        return ctx.switchToWs().getClient().client.request.user;
      case 'graphql':
        return GqlExecutionContext.create(ctx).getContext().req.user;
    }
  },
);
