import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { type Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxCurrency } from 'src/auth/ctx-currency.decorator';
import { BgrService } from 'src/bgr/bgr.service';
import { FinanceService } from 'src/finance/finance.service';
import { Currency, type User } from 'src/graphql';
import { OrdersService } from 'src/orders/orders.service';
import { ReviewsService } from 'src/reviews/reviews.service';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { UsersService } from './users.service';

@Resolver('PublicProfile')
export class PublicProfileResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
    private readonly reviewsService: ReviewsService,
    private readonly ordersSerivce: OrdersService,
    private readonly bgrService: BgrService,
    private readonly financeService: FinanceService,
    private readonly authGuard: AuthGuard,
  ) {}

  @Query()
  async publicProfile(@Args('slug') slug: string) {
    return this.usersService.getUserByIdOrLogin(slug);
  }

  @ResolveField()
  async roles(@Parent() parent: User) {
    return await this.usersService.getUserRoles(Number(parent.id));
  }

  @ResolveField()
  async avatar(@Parent() parent: User) {
    if (!parent.avatarKey) return null;
    const url = await this.storageService.getDownloadUrl(
      parent.avatarKey,
      StorageBuckets.Avatars,
    );
    return url.split('?')[0];
  }

  @ResolveField()
  async quantityOfPurchases(@Parent() parent: User) {
    return await this.ordersSerivce.countSuccessOrdersByBuyerId(
      Number(parent.id),
    );
  }
  @ResolveField()
  async quantityOfPurchasesForLast14Days(@Parent() parent: User) {
    return await this.ordersSerivce.countSuccessOrdersForLast14DaysByBuyerId(
      Number(parent.id),
    );
  }
  @ResolveField()
  async averageSumOfPurchases(@Parent() parent: User) {
    const result = await this.ordersSerivce.averageSumOfPurchasesByBuyerId(
      Number(parent.id),
    );
    return Number.parseFloat(result.toFixed(2));
  }

  @ResolveField()
  async averageSumOfPurchasesForLast14Days(@Parent() parent: User) {
    const result =
      await this.ordersSerivce.averageSumOfPurchasesForLast14DaysByBuyerId(
        Number(parent.id),
      );
    return Number.parseFloat(result.toFixed(2));
  }
  @ResolveField()
  async percentOfSuccessPurchases(@Parent() parent: User) {
    const allOrders = await this.ordersSerivce.countOrdersByBuyerId(
      Number(parent.id),
    );
    const completedOrders =
      await this.ordersSerivce.countCompletedOrdersByBuyerId(Number(parent.id));

    if (allOrders === 0) return 0;
    return Number.parseFloat(((completedOrders / allOrders) * 100).toFixed(2));
  }

  @ResolveField()
  async buyerPurchasesRank(@Parent() parent: User) {
    return await this.ordersSerivce.getRankByBuyerId(Number(parent.id));
  }

  @ResolveField()
  async percentOfSuccessPurchasesForLast14Days(@Parent() parent: User) {
    const allOrders =
      await this.ordersSerivce.countOrdersForLast14DaysByBuyerId(
        Number(parent.id),
      );
    const completedOrders =
      await this.ordersSerivce.countCompletedOrdersForLast14DaysByBuyerId(
        Number(parent.id),
      );
    if (allOrders === 0) return 0;
    return Number.parseFloat(((completedOrders / allOrders) * 100).toFixed(2));
  }

  @ResolveField()
  async countReviews(@Parent() parent: User) {
    return await this.reviewsService.countReviewsBySellerId(Number(parent.id));
  }

  @ResolveField()
  async countReviewsForLastYear(@Parent() parent: User) {
    return await this.reviewsService.countReviewsForLastYearBySellerId(
      Number(parent.id),
    );
  }

  @ResolveField()
  async averageRating(@Parent() parent: User) {
    return await this.reviewsService.countAverageRatingBySellerId(
      Number(parent.id),
    );
  }
  @ResolveField()
  async bgr(@Parent() parent: User) {
    return await this.bgrService.calcBgrByUserId(Number(parent.id));
  }

  @ResolveField()
  async inYourBlacklist(@Parent() user: User, @Context('req') req: Request) {
    if (!req.headers.authorization) return null;

    try {
      const authUser = await this.authGuard.getUserByAuthHeader(
        req.headers.authorization,
      );

      const bl = await this.usersService.checkUserInBlacklist({
        ownerId: authUser.id,
        bannedUserId: Number(user.id),
      });

      return !!bl;
    } catch {
      return false;
    }
  }

  @ResolveField()
  async bgrHistory(@Parent() parent: User) {
    return await this.bgrService.getBgrHistoryForLast6Weeks(Number(parent.id));
  }

  @ResolveField()
  async bgrRank(@Parent() parent: User) {
    const placeInTop = await this.bgrService.getPlaceInTop(Number(parent.id));
    return placeInTop?.rank || null;
  }

  @ResolveField()
  async quantityOfSales(@Parent() parent: User) {
    return await this.ordersSerivce.countSuccessOrdersBySellerId(
      Number(parent.id),
    );
  }
  @ResolveField()
  async quantityOfSalesForLast14Days(@Parent() parent: User) {
    return await this.ordersSerivce.countSuccessOrdersForLast14DaysBySellerId(
      Number(parent.id),
    );
  }
  @ResolveField()
  async averageSumOfSales(
    @Parent() parent: User,
    @CtxCurrency() currency: Currency,
  ) {
    const result = await this.ordersSerivce.averageSumOfSalesBySellerId(
      Number(parent.id),
      currency,
    );

    return Number.parseFloat(result.toFixed(2));
  }

  @ResolveField()
  async securityDeposit(@Parent() parent: User) {
    return await this.financeService.getSecurityDepositValue(Number(parent.id));
  }

  @ResolveField()
  async averageSumOfSalesForLast14Days(
    @Parent() parent: User,
    @CtxCurrency() currency: Currency,
  ) {
    const result =
      await this.ordersSerivce.averageSumOfSalesForLast14DaysBySellerId(
        Number(parent.id),
        currency,
      );
    return Number.parseFloat(result.toFixed(2));
  }

  @ResolveField()
  async percentOfSuccessOrdersForLast14Days(@Parent() parent: User) {
    const successOrders =
      await this.ordersSerivce.countSuccessOrdersForLast14DaysBySellerId(
        Number(parent.id),
      );

    const allOrders =
      await this.ordersSerivce.countOrdersForLast14DaysBySellerId(
        Number(parent.id),
      );

    if (allOrders === 0) return 0;
    return Number.parseFloat(((successOrders / allOrders) * 100).toFixed(2));
  }
  @ResolveField()
  async percentOfSuccessOrders(@Parent() parent: User) {
    const successOrders = await this.ordersSerivce.countSuccessOrdersBySellerId(
      Number(parent.id),
    );

    const allOrders = await this.ordersSerivce.countOrdersBySellerId(
      Number(parent.id),
    );

    if (allOrders === 0) return 0;
    return Number.parseFloat(((successOrders / allOrders) * 100).toFixed(2));
  }
}
