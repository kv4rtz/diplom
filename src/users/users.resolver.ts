import { ForbiddenException, Logger, UseGuards } from '@nestjs/common';
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
import { CtxCurrency } from 'src/auth/ctx-currency.decorator';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { BgrService } from 'src/bgr/bgr.service';
import { ErrorCause } from 'src/errors-couse';
import { FinanceService } from 'src/finance/finance.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { Currency, UserTradingOption } from 'src/graphql';
import { OrdersService } from 'src/orders/orders.service';
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { PermissionsService } from 'src/permissions/permissions.service';
import { ProductService } from 'src/products/products.service';
import { ReviewsService } from 'src/reviews/reviews.service';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { RequestCodeForChangeOldPasswordDto } from './dto/request-code-for-change-old-password.dto';
import { RequestCodeDto } from './dto/request-code.dto';
import { User } from './models/users.model';
import { UsersService } from './users.service';

@Resolver('User')
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
    private readonly reviewsService: ReviewsService,
    private readonly ordersSerivce: OrdersService,
    private readonly financeService: FinanceService,
    private readonly authGuard: AuthGuard,
    private readonly bgrService: BgrService,
    private readonly productsService: ProductService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Query()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('users.view')
  async users(
    @Args('pageInfo') pageInfo: PageInfoDto,
    @Args('search') search?: string,
    @Args('roleId') roleId?: number,
    @Args('onlyBuyers') onlyBuyers?: boolean,
    @Args('onlySellers') onlySellers?: boolean,
    @Args('onlyStaff') onlyStaff?: boolean,
    @Args('bgrMin') bgrMin?: number,
    @Args('bgrMax') bgrMax?: number,
    @Args('order') order?: string,
  ) {
    return await this.usersService.findAllWithPagination({
      pageInfo,
      search,
      roleId,
      onlyBuyers,
      onlySellers,
      onlyStaff,
      bgrMin,
      bgrMax,
      order,
    });
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async editAccount(@Args() dto: EditUserDto, @CtxUser() user: User) {
    await this.usersService.editUser(user.id, dto);
    return await this.usersService.getUserById(user.id);
  }

  @Mutation()
  async requestCode(@Args() dto: RequestCodeDto) {
    return !!(await this.usersService.requestCode(dto));
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async sendCodeForVerifyPhone(
    @Args('phone') phone: string,
    @CtxUser() user: User,
  ) {
    return await this.usersService.sendCodeForVerifyPhone(phone, user.id);
  }

  @Query()
  @UseGuards(AuthGuard)
  async myBlacklist(@CtxUser() user: User) {
    return await this.usersService.getUserBlacklist(user.id);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async addUserToBlacklist(
    @CtxUser() user: User,
    @Args('bannedUserId') bannedUserId: number,
  ) {
    return !!(await this.usersService.createUserBlacklist({
      bannedUserId,
      ownerId: user.id,
    }));
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async removeUserFromBlacklist(
    @CtxUser() user: User,
    @Args('bannedUserId') bannedUserId: number,
  ) {
    return !!(await this.usersService.removeUserFromBlacklist({
      bannedUserId,
      ownerId: user.id,
    }));
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async deleteUser(
    @Args('userId') userId: number,
    @Args('hardRemove') hardRemove: boolean = false,
    @CtxUser() authUser: User,
  ) {
    const hasAdminPermission = await this.usersService.hasPermissions(
      authUser.id,
      ['admin.users.delete'],
    );

    if (!hasAdminPermission && authUser.id !== userId) {
      throw new ForbiddenException(ErrorCause.FORBIDDEN);
    }

    return !!(await this.usersService.deleteUser(userId, hardRemove));
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async requestCodeForChangeOldPassword(
    @Args() dto: RequestCodeForChangeOldPasswordDto,
    @CtxUser() user: User,
  ) {
    return await this.usersService.requestCodeChangeOldPassword(
      user,
      dto.oldPassword,
    );
  }

  @Mutation()
  async changePassword(@Args() dto: ChangePasswordDto) {
    return !!(await this.usersService.changePasswordWithVerification(dto));
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async setTradingOption(
    @Args('option') option: UserTradingOption,
    @CtxUser() user: User,
  ) {
    return !!(await this.usersService.setTradingOption(user.id, option));
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async assignRole(@Args() dto: AssignRoleDto) {
    await this.usersService.assignRole(dto.userId, dto.roleId);
    return await this.usersService.getUserById(dto.userId);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async removeRole(@Args() dto: AssignRoleDto) {
    await this.usersService.removeRole(dto.userId, dto.roleId);
    return await this.usersService.getUserById(dto.userId);
  }

  @ResolveField()
  async roles(@Parent() parent: User) {
    return await this.usersService.getUserRoles(parent.id);
  }

  @ResolveField()
  async selectedTradingOption(@Parent() parent: User) {
    const options = await this.usersService.getUserOptions(parent.id);
    return options.tradingOption;
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
  async countReviews(@Parent() parent: User) {
    return await this.reviewsService.countReviewsBySellerId(parent.id);
  }

  @ResolveField()
  async securityDeposit(@Parent() parent: User) {
    return await this.financeService.getSecurityDepositValue(parent.id);
  }

  @ResolveField()
  async countReviewsForLastYear(@Parent() parent: User) {
    return await this.reviewsService.countReviewsForLastYearBySellerId(
      parent.id,
    );
  }
  @ResolveField()
  async quantityOfPurchases(@Parent() parent: User) {
    return await this.ordersSerivce.countSuccessOrdersByBuyerId(parent.id);
  }
  @ResolveField()
  async quantityOfPurchasesForLast14Days(@Parent() parent: User) {
    return await this.ordersSerivce.countSuccessOrdersForLast14DaysByBuyerId(
      parent.id,
    );
  }
  @ResolveField()
  async averageSumOfPurchases(
    @Parent() parent: User,
    @CtxCurrency() currency: Currency,
  ) {
    const result = await this.ordersSerivce.averageSumOfPurchasesByBuyerId(
      parent.id,
      currency,
    );

    return Number.parseFloat(result.toFixed(2));
  }

  @ResolveField()
  async averageSumOfPurchasesForLast14Days(
    @Parent() parent: User,
    @CtxCurrency() currency: Currency,
  ) {
    const result =
      await this.ordersSerivce.averageSumOfPurchasesForLast14DaysByBuyerId(
        parent.id,
        currency,
      );

    return Number.parseFloat(result.toFixed(2));
  }
  @ResolveField()
  async percentOfSuccessPurchases(@Parent() parent: User) {
    const allOrders = await this.ordersSerivce.countOrdersByBuyerId(parent.id);
    const completedOrders =
      await this.ordersSerivce.countCompletedOrdersByBuyerId(parent.id);

    if (allOrders === 0) return 0;
    return Number.parseFloat(((completedOrders / allOrders) * 100).toFixed(2));
  }

  @ResolveField()
  async percentOfSuccessPurchasesForLast14Days(@Parent() parent: User) {
    const allOrders =
      await this.ordersSerivce.countOrdersForLast14DaysByBuyerId(parent.id);
    const completedOrders =
      await this.ordersSerivce.countCompletedOrdersForLast14DaysByBuyerId(
        parent.id,
      );
    if (allOrders === 0) return 0;
    return Number.parseFloat(((completedOrders / allOrders) * 100).toFixed(2));
  }

  @ResolveField()
  async buyerPurchasesRank(@Parent() parent: User) {
    return await this.ordersSerivce.getRankByBuyerId(parent.id);
  }

  @ResolveField()
  async averageRating(@Parent() parent: User) {
    return await this.reviewsService.countAverageRatingBySellerId(parent.id);
  }
  @ResolveField()
  async bgr(@Parent() parent: User) {
    return await this.bgrService.calcBgrByUserId(parent.id);
  }

  @ResolveField()
  async bgrHistory(@Parent() parent: User) {
    return await this.bgrService.getBgrHistoryForLast6Weeks(parent.id);
  }

  @ResolveField()
  async bgrRank(@Parent() parent: User) {
    const placeInTop = await this.bgrService.getPlaceInTop(parent.id);
    return placeInTop?.rank || null;
  }

  @ResolveField()
  async quantityOfSales(@Parent() parent: User) {
    return await this.ordersSerivce.countSuccessOrdersBySellerId(parent.id);
  }
  @ResolveField()
  async quantityOfSalesForLast14Days(@Parent() parent: User) {
    return await this.ordersSerivce.countSuccessOrdersForLast14DaysBySellerId(
      parent.id,
    );
  }
  @ResolveField()
  async averageSumOfSales(
    @Parent() parent: User,
    @CtxCurrency() currency: Currency,
  ) {
    const result = await this.ordersSerivce.averageSumOfSalesBySellerId(
      parent.id,
      currency,
    );

    return Number.parseFloat(result.toFixed(2));
  }

  @ResolveField()
  async averageSumOfSalesForLast14Days(
    @Parent() parent: User,
    @CtxCurrency() currency: Currency,
  ) {
    const result =
      await this.ordersSerivce.averageSumOfSalesForLast14DaysBySellerId(
        parent.id,
        currency,
      );

    return Number.parseFloat(result.toFixed(2));
  }

  @ResolveField()
  async percentOfSuccessOrdersForLast14Days(@Parent() parent: User) {
    const successOrders =
      await this.ordersSerivce.countSuccessOrdersForLast14DaysBySellerId(
        parent.id,
      );

    const allOrders =
      await this.ordersSerivce.countOrdersForLast14DaysBySellerId(parent.id);

    if (allOrders === 0) return 0;
    return Number.parseFloat(((successOrders / allOrders) * 100).toFixed(2));
  }
  @ResolveField()
  async percentOfSuccessOrders(@Parent() parent: User) {
    const successOrders = await this.ordersSerivce.countSuccessOrdersBySellerId(
      parent.id,
    );

    const allOrders = await this.ordersSerivce.countOrdersBySellerId(parent.id);

    if (allOrders === 0) return 0;
    return Number.parseFloat(((successOrders / allOrders) * 100).toFixed(2));
  }

  @ResolveField()
  async email(@Parent() user: User, @Context('req') req: Request) {
    if (!req.headers.authorization) return null;

    try {
      const authUser = await this.authGuard.getUserByAuthHeader(
        req.headers.authorization,
      );

      const hasAdminPermission = await this.usersService.hasPermissions(
        authUser.id,
        ['admin.users.email.view'],
      );

      if (!hasAdminPermission && authUser.id !== user.id) return null;

      return user.email;
    } catch {
      return null;
    }
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
        bannedUserId: user.id,
      });

      return !!bl;
    } catch {
      return false;
    }
  }

  @ResolveField()
  async activeFinanceAmount(
    @Parent() user: User,
    @Context('req') req: Request,
  ) {
    if (!req.headers.authorization) return null;

    try {
      const authUser = await this.authGuard.getUserByAuthHeader(
        req.headers.authorization,
      );

      if (authUser.id !== user.id) return null;

      const userFinance = await this.financeService.findOrCreate({
        userId: user.id,
      });
      return userFinance?.[
        user.selectedCurrency.toLocaleLowerCase() as 'rub' | 'eur' | 'usd'
      ];
    } catch {
      return null;
    }
  }

  @ResolveField()
  async dateWhenCanBeLiftedProduct(@Parent() parent: User) {
    return await this.productsService.getDateWhenCanBeLiftedProduct(parent.id);
  }

  @ResolveField()
  async countProducts(@Parent() parent: User) {
    return await this.productsService.countProductsBySellerId(parent.id);
  }
}
