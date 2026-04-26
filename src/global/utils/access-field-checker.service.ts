import { Injectable } from '@nestjs/common';
import { type Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { PermissionCode } from 'src/permissions/models/permissions.constant';
import { UsersService } from 'src/users/users.service';

export type CheckUserOrPermissionForFieldOptions = {
  ownerUserId?: number;
  permissions?: PermissionCode[];
  returnIfForbidden?: unknown;
};

@Injectable()
export class AccessFieldChecker {
  constructor(
    private readonly authGuard: AuthGuard,
    private readonly usersService: UsersService,
  ) {}

  async check(
    req: Request,
    fieldValue: unknown,
    options: CheckUserOrPermissionForFieldOptions,
  ) {
    if (!req.headers.authorization) return options.returnIfForbidden || null;

    try {
      const authUser = await this.authGuard.getUserByAuthHeader(
        req.headers.authorization,
      );

      if (authUser.id === options.ownerUserId) return fieldValue;

      if (options.permissions) {
        const accessed = await this.usersService.hasPermissions(
          authUser.id,
          options.permissions,
        );

        if (accessed) return fieldValue;
      }
      return options.returnIfForbidden || null;
    } catch {
      return options.returnIfForbidden || null;
    }
  }
}
