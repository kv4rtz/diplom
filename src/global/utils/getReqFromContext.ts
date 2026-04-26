import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Socket } from 'socket.io';
import { User } from 'src/users/models/users.model';

export const getReqFromContext = (
  context: ExecutionContext,
): {
  headers: { authorization?: string };
  user?: User;
} => {
  switch (context.getType() as 'http' | 'ws' | 'graphql') {
    case 'http':
      return context.switchToHttp().getRequest();
    case 'ws':
      return (context.switchToWs().getClient() as Socket).client.request;
    case 'graphql':
      return GqlExecutionContext.create(context).getContext().req;
  }
};
