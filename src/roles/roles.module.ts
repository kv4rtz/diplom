import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { Permission } from 'src/permissions/models/permissions.model';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { UsersModule } from 'src/users/users.module';
import { RolePermission } from './models/roles-permissions.model';
import { RoleTranslation } from './models/roles-translations.model';
import { Role } from './models/roles.model';
import { RolesResolver } from './roles.resolver';
import { RolesService } from './roles.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Role,
      RoleTranslation,
      Permission,
      RolePermission,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    PermissionsModule,
  ],
  providers: [RolesResolver, RolesService],
  exports: [RolesService],
})
export class RolesModule {}
