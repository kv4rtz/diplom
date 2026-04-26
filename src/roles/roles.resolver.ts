import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { type Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { type Locale, type Role } from 'src/graphql';
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Resolver('Role')
export class RolesResolver {
  constructor(
    private readonly rolesService: RolesService,
    private readonly authGuard: AuthGuard,
    private readonly usersService: UsersService,
  ) {}

  @Query()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('roles.view')
  roles() {
    return this.rolesService.findAll();
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('roles.create')
  createRole(@Args() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  becomeSeller(@Args('approval') approval: boolean, @CtxUser() user: User) {
    return this.rolesService.becomeSeller(approval, user.id);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('roles.update')
  updateRole(@Args() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(dto);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('roles.delete')
  async deleteRole(@Args('id') id: number) {
    return !!(await this.rolesService.deleteRole(id));
  }

  @ResolveField()
  async permissions(@Parent() parent: Role, @Context('req') req: Request) {
    if (req.headers.authorization) {
      try {
        const user = await this.authGuard.getUserByAuthHeader(
          req.headers.authorization,
        );
        if (
          await this.usersService.hasPermissions(user.id, ['permissions.view'])
        ) {
          return await this.rolesService.getRolePermissions(Number(parent.id));
        }

        const role = user.roles.find((role) => role.id === parent.id);
        if (!role) return null;

        return await this.rolesService.getRolePermissions(Number(parent.id));
      } catch {
        return null;
      }
    } else {
      return null;
    }
  }

  @ResolveField()
  async name(@Parent() parent: Role, @CtxLocale() locale: Locale) {
    const translation = await this.rolesService.getRoleTranslation(
      Number(parent.id),
      locale,
    );
    return translation?.name;
  }

  @ResolveField()
  async translations(@Parent() parent: Role) {
    return await this.rolesService.getRoleTranslations(Number(parent.id));
  }
}
