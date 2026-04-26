import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CtxCurrency } from 'src/auth/ctx-currency.decorator';
import { ComissionType, Currency } from 'src/graphql';
import { CommissionsService } from './commissions.service';

@Resolver('CostCalculated')
export class CostCalculatedResolver {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Query()
  async calculateCost(
    @Args('amount') amount: number,
    @Args('type') type: ComissionType,
    @CtxCurrency() currency: Currency,
  ) {
    return await this.commissionsService.calculateCost(amount, type, currency);
  }

  @ResolveField()
  async commission(@Parent() costCalculated: { commissionId: number }) {
    return await this.commissionsService.findOneById(
      costCalculated.commissionId,
    );
  }
}
