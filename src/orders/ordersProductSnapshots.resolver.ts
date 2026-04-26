import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CtxCurrency } from 'src/auth/ctx-currency.decorator';
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { GameCategoryService } from 'src/game-categories/game-categories.service';
import { Currency, Locale } from 'src/graphql';
import { ProductService } from 'src/products/products.service';
import { ReviewsService } from 'src/reviews/reviews.service';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { UsersService } from 'src/users/users.service';
import { OrderProductSnapshot } from './models/order-product-snapshot.model';
import { OrdersService } from './orders.service';

@Resolver('OrderProductSnapshot')
export class OrdersProductSnapshotsResolver {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly productService: ProductService,
    private readonly usersService: UsersService,
    private readonly reviewsService: ReviewsService,
    private readonly gameCategoriesService: GameCategoryService,
    private readonly currenciesService: CurrenciesService,
    private readonly storageService: StorageService,
  ) {}

  @ResolveField()
  async order(@Parent() orderProductSnapshot: OrderProductSnapshot) {
    return await this.ordersService.getProductSnapshotByOrderId(
      orderProductSnapshot.orderId,
    );
  }

  @ResolveField()
  async originalProduct(@Parent() orderProductSnapshot: OrderProductSnapshot) {
    return await this.productService.findById(
      orderProductSnapshot.originalProductId,
      {
        paranoid: false,
      },
    );
  }

  @ResolveField()
  async gameCategory(@Parent() orderProductSnapshot: OrderProductSnapshot) {
    return await this.gameCategoriesService.findById(
      orderProductSnapshot.gameCategoryId,
    );
  }

  @ResolveField()
  async seller(@Parent() orderProductSnapshot: OrderProductSnapshot) {
    return await this.usersService.getUserById(orderProductSnapshot.sellerId);
  }

  @ResolveField()
  async price(
    @Parent() orderProductSnapshot: OrderProductSnapshot,
    @CtxCurrency() currency: Currency,
  ) {
    return await this.currenciesService.convert(
      orderProductSnapshot.price!,
      orderProductSnapshot.currency,
      currency,
    );
  }

  @ResolveField()
  async name(
    @Parent() orderProductSnapshot: OrderProductSnapshot,
    @CtxLocale() locale: Locale,
  ) {
    const translation = await this.ordersService.getProductSnapshotTranslation(
      orderProductSnapshot.orderId,
      locale,
    );
    return translation?.name;
  }

  @ResolveField()
  async description(
    @Parent() orderProductSnapshot: OrderProductSnapshot,
    @CtxLocale() locale: Locale,
  ) {
    const translation = await this.ordersService.getProductSnapshotTranslation(
      orderProductSnapshot.orderId,
      locale,
    );
    return translation?.description;
  }

  @ResolveField()
  async translations(@Parent() orderProductSnapshot: OrderProductSnapshot) {
    return await this.ordersService.getProductSnapshotAllTranslations(
      orderProductSnapshot.orderId,
    );
  }

  @ResolveField()
  async options(@Parent() orderProductSnapshot: OrderProductSnapshot) {
    return await this.ordersService.getProductSnapshotOptions(
      orderProductSnapshot.orderId,
    );
  }

  @ResolveField()
  async images(@Parent() orderProductSnapshot: OrderProductSnapshot) {
    const fileKeys = await this.ordersService.getProductSnapshotFileKeys(
      orderProductSnapshot.orderId,
    );
    if (!fileKeys) return null;

    const images = await Promise.all(
      fileKeys.map(async (key) => {
        const url = await this.storageService.getDownloadUrl(
          key.fileKey,
          StorageBuckets.BannersAndIcons,
        );
        return url.split('?')[0];
      }),
    );

    return images;
  }
}
