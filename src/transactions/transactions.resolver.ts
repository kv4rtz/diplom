import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { FinanceService } from 'src/finance/finance.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { OrderStatus, TransactionType } from 'src/graphql';
import { OrdersService } from 'src/orders/orders.service';
import { User } from 'src/users/models/users.model';
import { BuyProductFromBalanceDto } from './dto/create-transactions.dto';
import { WithdrawalRublesDto } from './dto/withdrawal-rubles.dto';
import { Transaction } from './model/transactions.model';
import { TransactionsService } from './transactions.service';

@Resolver('Transaction')
export class TransactionsResolver {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly financeService: FinanceService,
    private readonly ordersService: OrdersService,
  ) {}

  @Query()
  @UseGuards(AuthGuard)
  async myTransactions(
    @CtxUser() user: User,
    @Args('pageInfo') pageInfo: PageInfoDto,
    @Args('onlyPurchases') onlyPurchases: boolean,
    @Args('onlySales') onlySales: boolean,
    @Args('orderStatus') orderStatus?: OrderStatus,
    @Args('gameId') gameId?: number,
    @Args('gameCategoryId') gameCategoryId?: number,
    @Args('order') order?: string,
    @Args('searchByLoginOrOrderId') searchByLoginOrOrderId?: string,
    @Args('type') type?: TransactionType,
    @Args('paymentMethod') paymentMethod?: string,
  ) {
    return await this.transactionsService.findByUserId(user.id, {
      order,
      pageInfo,
      onlyPurchases,
      onlySales,
      orderStatus,
      gameId,
      gameCategoryId,
      searchByLoginOrOrderId,
      type,
      paymentMethod,
    });
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async getReplenishAccountYooKassaUrl(
    @Args('amount') amount: number,
    @Args('buyProductId') buyProductId: number,
    @CtxUser() user: User,
  ) {
    return await this.transactionsService.getReplenishAccountYooKassaUrl(
      amount,
      user.id,
      buyProductId,
    );
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async buyProductFromBalance(
    @Args() dto: BuyProductFromBalanceDto,
    @CtxUser() user: User,
  ) {
    return await this.transactionsService.buyProductFromBalance(dto, user);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async withdrawalRubles(
    @Args() dto: WithdrawalRublesDto,
    @CtxUser() user: User,
  ) {
    return await this.transactionsService.withdrawalRubles(dto, user.id);
  }

  @ResolveField()
  async finance(transaction: Transaction) {
    return await this.financeService.findById(transaction.financeId);
  }

  @ResolveField()
  async order(transaction: Transaction) {
    if (!transaction.orderId) return null;
    return await this.ordersService.getOrderById(transaction.orderId);
  }
}
