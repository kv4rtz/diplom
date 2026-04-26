import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Currency } from 'src/graphql';

function extractCurrencyFromRequest(req: any): Currency {
  if (req?.user?.selectedCurrency) {
    return req.user.selectedCurrency;
  }

  const headerCurrency = req?.headers?.['accept-currency'];
  if (
    headerCurrency &&
    Object.values(Currency).includes(headerCurrency as Currency)
  ) {
    return headerCurrency as Currency;
  }

  return Currency.RUB;
}

export const CtxCurrency = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    let req: any;

    switch (ctx.getType<'http' | 'ws' | 'graphql'>()) {
      case 'http':
        req = ctx.switchToHttp().getRequest();
        break;
      case 'ws':
        req = ctx.switchToWs().getClient().client.request;
        break;
      case 'graphql':
        req = GqlExecutionContext.create(ctx).getContext().req;
        break;
    }

    return extractCurrencyFromRequest(req);
  },
);
