import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { RolePermission } from 'src/roles/models/roles-permissions.model';
import { Role } from 'src/roles/models/roles.model';
import { UsersModule } from 'src/users/users.module';
import { Permission } from './models/permissions.model';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsResolver } from './permissions.resolver';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Permission, Role, RolePermission]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  providers: [PermissionsResolver, PermissionsService, PermissionsGuard],
  exports: [PermissionsService],
})
export class PermissionsModule {}
