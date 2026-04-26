import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequiredPermission } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from './permissions.service';

@Resolver('Permission')
export class PermissionsResolver {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Query()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('permissions.view')
  async permissions() {
    return await this.permissionsService.findAll();
  }

  @Query()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('permissions.view')
  async permission(@Args('id') id: number) {
    return await this.permissionsService.findById(id);
  }
}
