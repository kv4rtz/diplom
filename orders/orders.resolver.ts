import { NotFoundException, UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxCurrency } from 'src/auth/ctx-currency.decorator';
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { Currency, Locale, OrderStatus } from 'src/graphql';
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { ProductService } from 'src/products/products.service';
import { ReviewsService } from 'src/reviews/reviews.service';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './models/orders.model';
import { OrdersService } from './orders.service';

@Resolver('Order')
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly productService: ProductService,
    private readonly usersService: UsersService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Query()
  @UseGuards(AuthGuard)
  async myOrders(
    @CtxUser() user: User,
    @Args('pageInfo') pageInfo: PageInfoDto,
    @Args('onlySales') onlySales?: boolean,
    @Args('gameId') gameId?: number,
    @Args('gameCategoryId') gameCategoryId?: number,
    @Args('orderStatus') orderStatus?: OrderStatus,
    @Args('paymentMethod') paymentMethod?: string,
    @Args('searchByLoginOrOrderId') searchByLoginOrOrderId?: string,
    @Args('order') order?: string,
  ) {
    return await this.ordersService.findAllWithPaginationAndOptions({
      userId: user.id,
      pageInfo,
      onlySales,
      gameId,
      gameCategoryId,
      orderStatus,
      paymentMethod,
      searchByLoginOrOrderId,
      order,
    });
  }

  @Query()
  @UseGuards(AuthGuard)
  async orderById(@CtxUser() user: User, @Args('orderId') orderId: string) {
    return await this.ordersService.findByIdAndUserId(user.id, orderId);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async createOrder(
    @Args() dto: CreateOrderDto,
    @CtxUser() user: User,
    @CtxCurrency() currency: Currency,
    @CtxLocale() locale: Locale,
  ) {
    return await this.ordersService.createOrderEndpoint(
      dto,
      user,
      currency,
      locale,
      undefined,
      undefined,
      true,
    );
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('orders.makeOrderIsProblematic')
  async makeOrderIsProblematic(@Args('orderId') orderId: string) {
    return await this.ordersService.makeOrderIsProblematic(orderId);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  async reopenOrder(@Args('orderId') orderId: string, @CtxUser() user: User) {
    return await this.ordersService.reopenOrder(orderId, user.id);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  async refundOrder(@Args('orderId') orderId: string, @CtxUser() user: User) {
    return await this.ordersService.refundOrder(orderId, user.id);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('orders.makeOrderIsPriority')
  async makeOrderIsPriority(@Args('orderId') orderId: string) {
    return await this.ordersService.makeOrderIsPriority(orderId);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async makeOrderIsCompletedAndSendMoneyToSeller(
    @Args('orderId') orderId: string,
    @CtxUser() user: User,
  ) {
    return await this.ordersService.makeOrderIsCompletedAndSendMoneyToSeller(
      orderId,
      user.id,
    );
  }

  @ResolveField()
  async productSnapshot(@Parent() order: Order) {
    return await this.ordersService.getProductSnapshotByOrderId(order.id);
  }

  @ResolveField()
  async productLot(@Parent() order: Order, @CtxUser() user: User) {
    if (!order.productLotId) return null;
    if (!user) return null;
    if (![order.buyerId, order.productSnapshot?.sellerId].includes(user.id))
      return null;

    try {
      const lot = await this.productService.getProductLotById(
        order.productLotId,
      );
      return lot!.text;
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
      return null;
    }
  }

  @ResolveField()
  async review(@Parent() order: Order) {
    return await this.reviewsService.getReviewByOrderId(order.id);
  }

  @ResolveField()
  async buyer(@Parent() order: Order) {
    return await this.usersService.getUserById(order.buyerId);
  }
}
