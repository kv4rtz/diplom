import { UseGuards } from '@nestjs/common';
import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { FinanceService } from './finance.service';
import { Finance } from './models/finance.model';

@Resolver('Finance')
export class FinanceResolver {
  constructor(
    private readonly financeService: FinanceService,
    private readonly usersService: UsersService,
  ) {}

  @Query()
  @UseGuards(AuthGuard)
  async getMyFinance(@CtxUser() user: User) {
    return await this.financeService.findOrCreate({ userId: user.id });
  }

  @ResolveField()
  async user(@Parent() finance: Finance) {
    return await this.usersService.getUserById(finance.userId);
  }
}
