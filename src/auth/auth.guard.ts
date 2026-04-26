import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ErrorCause } from 'src/errors-couse';
import { getReqFromContext } from 'src/global/utils/getReqFromContext';
import { Role } from 'src/roles/models/roles.model';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  private contextType: 'http' | 'ws' | 'graphql';

  getUnauthorizedException() {
    switch (this.contextType) {
      case 'http':
        return new UnauthorizedException();
      case 'ws':
        return new WsException(ErrorCause.UNAUTHORIZED);
      case 'graphql':
        return new UnauthorizedException();
    }
  }

  async setContextType(contextType: 'http' | 'ws' | 'graphql') {
    this.contextType = contextType;
  }

  async getUserByAuthHeader(authHeader?: string) {
    if (!authHeader) throw this.getUnauthorizedException();

    const token = authHeader.split(' ')[1];
    if (!token) throw this.getUnauthorizedException();

    try {
      const payload = this.authService.verifyAccessToken(token);
      if (payload.isTwoFactorPending) {
        throw this.getUnauthorizedException();
      }
      const user = await this.usersService.getUserById(payload.id, {
        include: [Role],
      });
      if (!user) throw this.getUnauthorizedException();
      return user;
    } catch {
      throw this.getUnauthorizedException();
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.setContextType(context.getType() as 'http' | 'ws' | 'graphql');
    const req = getReqFromContext(context);

    req.user = await this.getUserByAuthHeader(req.headers?.authorization);

    return true;
  }
}
