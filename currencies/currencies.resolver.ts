import { Args, Query, Resolver } from '@nestjs/graphql';
import { Currency, CurrencyValue } from 'src/graphql';
import { CurrenciesService } from './currencies.service';

@Resolver()
export class CurrenciesResolver {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Query()
  async convertAmount(
    @Args('amount') amount: number,
    @Args('from') from: Currency,
  ) {
    const toArray = Object.values(Currency).filter(
      (currency) => currency !== from,
    );

    const result: CurrencyValue[] = [];

    for (const to of toArray) {
      result.push({
        currency: to,
        amount: await this.currenciesService.convert(amount, from, to),
      });
    }

    return result;
  }
}
