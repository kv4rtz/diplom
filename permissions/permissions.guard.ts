import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { AuthGuard } from 'src/auth/auth.guard';
import { ErrorCause } from 'src/errors-couse';
import { getReqFromContext } from 'src/global/utils/getReqFromContext';
import { UsersService } from 'src/users/users.service';
import { PermissionCode } from './models/permissions.constant';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly authGuard: AuthGuard,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  private contextType: 'http' | 'ws' | 'graphql';

  getForbiddenException() {
    switch (this.contextType) {
      case 'http':
        return new ForbiddenException();
      case 'ws':
        return new WsException(ErrorCause.FORBIDDEN);
      case 'graphql':
        return new ForbiddenException();
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.authGuard.canActivate(context);

    this.contextType = context.getType() as 'http' | 'ws' | 'graphql';
    const req = getReqFromContext(context);
    const user = req.user;

    if (!user) throw this.getForbiddenException();

    const requiredPermissions = this.reflector.get<PermissionCode[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) return true;

    const hasPermissions = await this.usersService.hasPermissions(
      user.id,
      requiredPermissions,
    );
    if (!hasPermissions) throw this.getForbiddenException();

    return true;
  }
}
