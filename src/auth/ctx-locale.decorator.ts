import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Locale } from 'src/graphql';

function extractLocaleFromRequest(req: any): Locale {
  if (req?.user?.selectedLocale) {
    return req.user.selectedLocale;
  }

  const headerLocale = req?.headers?.['accept-locale'];
  if (headerLocale && Object.values(Locale).includes(headerLocale as Locale)) {
    return headerLocale as Locale;
  }

  return Locale.ru;
}

export const CtxLocale = createParamDecorator(
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

    return extractLocaleFromRequest(req);
  },
);
