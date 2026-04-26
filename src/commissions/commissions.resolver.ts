import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { type Commission, type Locale } from 'src/graphql';
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { CommissionsService } from './commissions.service';

@Resolver('Commission')
export class CommissionsResolver {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Query()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('commissions.view')
  async commissions() {
    return this.commissionsService.findAll();
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('commissions.update')
  async updateComission(
    @Args('comissionId') comissionId: number,
    @Args('percentage') percentage: number,
  ) {
    return this.commissionsService.updateComission(comissionId, percentage);
  }

  @ResolveField()
  async translations(@Parent() comission: Commission) {
    return this.commissionsService.findTranslationsByCommissionId(comission.id);
  }

  @ResolveField()
  async method(@Parent() comission: Commission, @CtxLocale() locale: Locale) {
    const translation =
      await this.commissionsService.findOneTranslationByCommissionId(
        comission.id,
        locale,
      );
    return translation?.method;
  }
}
