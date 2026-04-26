import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from './models/permissions.constant';

export const RequiredPermission = (...args: PermissionCode[]) =>
  SetMetadata('permissions', args);
