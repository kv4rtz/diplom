import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { type Review } from 'src/graphql';
import { OrdersService } from 'src/orders/orders.service';
import { ProductService } from 'src/products/products.service';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import {
  CreateReviewAnswerDto,
  CreateReviewDto,
} from './dto/create-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import {
  UpdateReviewAnswerDto,
  UpdateReviewDto,
} from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@Resolver('Review')
export class ReviewsResolver {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly usersService: UsersService,
    private readonly productsService: ProductService,
    private readonly ordersService: OrdersService,
  ) {}

  @Query()
  reviews(@Args('pageInfo') pageInfo: PageInfoDto, @Args() dto: GetReviewsDto) {
    return this.reviewsService.getAllReviewsWithPagination(pageInfo, dto);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  createReview(@Args() dto: CreateReviewDto, @CtxUser() user: User) {
    return this.reviewsService.createReview(user.id, dto);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  updateReview(@Args() dto: UpdateReviewDto, @CtxUser() user: User) {
    return this.reviewsService.updateReview(dto.id, user.id, dto);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  deleteReview(@Args('id') id: number, @CtxUser() user: User) {
    return this.reviewsService.deleteReview(id, user.id);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async createAnswerToReview(
    @Args() dto: CreateReviewAnswerDto,
    @CtxUser() user: User,
  ) {
    return this.reviewsService.createAnswerToReview(user.id, dto);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async updateAnswerToReview(
    @Args() dto: UpdateReviewAnswerDto,
    @CtxUser() user: User,
  ) {
    return this.reviewsService.updateAnswerToReview(dto.id, user.id, dto);
  }

  @ResolveField()
  async user(@Parent() parent: Review) {
    return await this.usersService.getUserById(Number(parent.userId));
  }

  @ResolveField()
  async product(@Parent() parent: Review) {
    if (!parent.productId) return null;

    return await this.productsService.findById(Number(parent.productId), {
      paranoid: false,
    });
  }

  @ResolveField()
  async order(@Parent() parent: Review, @CtxUser() user: User) {
    if (!parent.orderId) return null;
    if (!user) return null;
    if (user.id !== parent.userId) return null;

    return await this.ordersService.getOrderById(parent.orderId);
  }

  @ResolveField()
  async replyTo(@Parent() parent: Review) {
    if (!parent.reviewId) return null;
    return await this.reviewsService.getParentReview(parent.reviewId);
  }

  @ResolveField()
  async sellerAnswer(@Parent() parent: Review) {
    if (!parent.id) return null;
    return await this.reviewsService.getChildReview(parent.id);
  }
}
