import { Query, Resolver } from '@nestjs/graphql';
import { GeneralService } from './general.service';

@Resolver('General')
export class GeneralResolver {
  constructor(private readonly generalService: GeneralService) {}

  @Query()
  async getCountsOnlineAndProducts() {
    return await this.generalService.countsOnlineAndProducts();
  }
}
