import { BadRequestException, UseGuards } from '@nestjs/common';
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
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { CommissionsService } from 'src/commissions/commissions.service';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { ErrorCause } from 'src/errors-couse';
import { FinanceService } from 'src/finance/finance.service';
import { GameCategoryService } from 'src/game-categories/game-categories.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { ComissionType, Currency, Locale } from 'src/graphql';
import { IpService } from 'src/ip/ip.service';
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  ProductFilterOptionInputDto,
  ProductPriceFilterInputDto,
} from './dto/product-filter-option-input.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './models/products.model';
import { ProductService } from './products.service';

@Resolver('Product')
export class ProductResolver {
  constructor(
    private readonly authGuard: AuthGuard,
    private readonly storageService: StorageService,
    private readonly productService: ProductService,
    private readonly gameCategoryService: GameCategoryService,
    private readonly usersService: UsersService,
    private readonly currencyService: CurrenciesService,
    private readonly commissionsService: CommissionsService,
    private readonly ipService: IpService,
    private readonly financeService: FinanceService,
  ) {}

  @Query()
  @UseGuards(AuthGuard)
  async myProducts(
    @CtxUser() user: User,
    @CtxCurrency() currency: Currency,
    @Args('pageInfo') dto: PageInfoDto,
    @Args('search') search?: string,
    @Args('autoDelivery') autoDelivery?: boolean,
    @Args('mostViewedFirst') mostViewedFirst?: boolean,
    @Args('filters') filters?: ProductFilterOptionInputDto[],
    @Args('priceFilter') priceFilter?: ProductPriceFilterInputDto,
    @Args('hasReviews') hasReviews?: boolean,
    @Args('gameCategoryId') gameCategoryId?: number,
    @Args('globalCategoryId') globalCategoryId?: number,
    @Args('gameId') gameId?: number,
    @Args('firstOrderBy') firstOrderBy?: string,
    @Args('secondOrderBy') secondOrderBy?: string,
    @Args('active') active?: boolean,
  ) {
    return await this.productService.findUserProductsWithPagination(
      dto,
      user.id,
      search,
      autoDelivery,
      hasReviews,
      filters,
      priceFilter,
      gameCategoryId,
      globalCategoryId,
      gameId,
      firstOrderBy,
      secondOrderBy,
      active,
      currency,
      mostViewedFirst,
    );
  }

  @Query()
  async products(
    @Args('pageInfo') dto: PageInfoDto,
    @CtxCurrency() currency: Currency,
    @Context('req') req: Request,
    @Args('search') search?: string,
    @Args('sellerOnline') sellerOnline?: boolean,
    @Args('autoDelivery') autoDelivery?: boolean,
    @Args('mostViewedFirst') mostViewedFirst?: boolean,
    @Args('hasReviews') hasReviews?: boolean,
    @Args('filters') filters?: ProductFilterOptionInputDto[],
    @Args('priceFilter') priceFilter?: ProductPriceFilterInputDto,
    @Args('sellerId') sellerId?: number,
    @Args('gameCategoryId') gameCategoryId?: number,
    @Args('globalCategoryId') globalCategoryId?: number,
    @Args('gameId') gameId?: number,
    @Args('firstOrderBy') firstOrderBy?: string,
    @Args('secondOrderBy') secondOrderBy?: string,
    @Args('active') active?: boolean,
    @Args('isFavourite') isFavourite?: boolean,
  ) {
    return this.productService.findAllWithPagination(
      dto,
      search,
      sellerOnline,
      autoDelivery,
      hasReviews,
      filters,
      priceFilter,
      sellerId,
      gameCategoryId,
      globalCategoryId,
      gameId,
      firstOrderBy,
      secondOrderBy,
      active,
      currency,
      isFavourite,
      req,
      mostViewedFirst,
    );
  }

  @Query()
  @UseGuards(AuthGuard)
  async lastViewedMyProductsByUserId(
    @Args('userId') userId: number,
    @CtxUser() seller: User,
  ) {
    return await this.productService.lastViewedMyProductsByUserId(
      userId,
      seller.id,
    );
  }

  @Query()
  async product(@Args('id') id: number, @Context('req') req: Request) {
    const ip = this.ipService.getIpFromRequest(req);

    let userId: number | undefined = undefined;
    if (req.headers.authorization) {
      try {
        const user = await this.authGuard.getUserByAuthHeader(
          req.headers.authorization,
        );

        userId = user.id;
      } catch {}
    }

    await this.productService.addProductView(id, ip, userId);
    return await this.productService.findById(id);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('products.create')
  async createProduct(
    @Args() dto: CreateProductDto,
    @CtxCurrency() currency: Currency,
    @CtxUser() user: User,
  ) {
    return await this.productService.createProduct(dto, user.id, currency);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  async updateProduct(@Args() dto: UpdateProductDto, @CtxUser() user: User) {
    return await this.productService.updateProduct(dto.id, dto, user.id);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('products.update')
  async liftMyProduct(@Args('ids') ids: number[], @CtxUser() user: User) {
    return await this.productService.liftMyProducts(ids, user.id);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  async exportProducts(
    @Args('ids') ids: number[],
    @CtxUser() user: User,
    @CtxLocale() locale: Locale,
  ) {
    const file = await this.productService.exportProductsToExcel(
      ids,
      user.id,
      locale,
    );
    const fileKey = await this.storageService.uploadFile(
      Buffer.from(file),
      'products-export.xlsx',
      StorageBuckets.Exports,
    );

    return await this.storageService.getDownloadUrl(
      fileKey,
      StorageBuckets.Exports,
    );
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  async importProducts(
    @Args('fileKey') fileKey: string,
    @CtxUser() user: User,
  ) {
    const buffer = await this.storageService.getBufferFile(
      fileKey,
      StorageBuckets.Exports,
    );

    return await this.productService.importProductsFromExcel(buffer, user.id);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async addProductToFavourites(
    @Args('productId') productId: number,
    @CtxUser() user: User,
  ) {
    const countFp = await this.productService.countProductFavouritesByUserId(
      user.id,
    );
    if (countFp >= 100)
      throw new BadRequestException(
        ErrorCause.THE_LIMIT_OF_FAVOURITED_PRODUCTS_HAS_BEEN_EXCEEDED,
      );

    return await this.productService.addProductToFavourites(productId, user.id);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async removeProductFromFavourites(
    @Args('productId') productId: number,
    @CtxUser() user: User,
  ) {
    return await this.productService.removeProductFromFavourites(
      productId,
      user.id,
    );
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async deleteProduct(@Args('id') id: number, @CtxUser() user: User) {
    return await this.productService.deleteProduct(id, user.id);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async copyProduct(@Args('id') id: number, @CtxUser() user: User) {
    return await this.productService.copyProduct(id, user.id);
  }

  @ResolveField()
  async lots(@Parent() product: Product, @Context('req') req: Request) {
    if (!req.headers.authorization) return null;

    try {
      const user = await this.authGuard.getUserByAuthHeader(
        req.headers.authorization,
      );

      if (user.id !== product.sellerId) return null;

      const lots = await this.productService.getProductLots(product.id);
      return lots.map((lot) => lot.text);
    } catch {
      return null;
    }
  }

  @ResolveField()
  async isFavourite(@Parent() product: Product, @Context('req') req: Request) {
    if (!req.headers.authorization) return false;

    try {
      const user = await this.authGuard.getUserByAuthHeader(
        req.headers.authorization,
      );

      return await this.productService.checkProductInFavourites(
        product.id,
        user.id,
      );
    } catch {
      return false;
    }
  }

  @ResolveField()
  async images(@Parent() product: Product) {
    const fileKeys = await this.productService.getProductFileKeys(product.id);
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

  @ResolveField()
  async imageKeys(@Parent() product: Product) {
    const fileKeys = await this.productService.getProductFileKeys(product.id);
    if (!fileKeys) return null;

    return fileKeys.map((key) => key.fileKey);
  }

  @ResolveField()
  async seller(@Parent() parent: Product) {
    return await this.usersService.getUserById(Number(parent.sellerId));
  }

  @ResolveField()
  async price(
    @Parent() parent: Product & { currency: Currency },
    @CtxCurrency() currency: Currency,
  ) {
    return this.commissionsService.calculateMinCost(
      await this.currencyService.convert(
        parent.price!,
        parent.currency,
        currency,
      ),
      ComissionType.REPLENISHMENT,
      currency,
    );
  }

  @ResolveField()
  async priceWithoutCommission(
    @Parent() parent: Product & { currency: Currency },
    @CtxCurrency() currency: Currency,
  ) {
    return await this.currencyService.convert(
      parent.price!,
      parent.currency,
      currency,
    );
  }

  @ResolveField()
  async gameCategory(@Parent() parent: Product) {
    return await this.gameCategoryService.findById(
      Number(parent.gameCategoryId),
    );
  }

  @ResolveField()
  async options(@Parent() parent: Product) {
    return await this.productService.getProductOptions(parent.id);
  }

  @ResolveField()
  async name(@Parent() parent: Product, @CtxLocale() locale: Locale) {
    const translation = await this.productService.getProductTranslation(
      Number(parent.id),
      locale,
    );
    return translation?.name;
  }
  @ResolveField()
  async description(@Parent() parent: Product, @CtxLocale() locale: Locale) {
    const translation = await this.productService.getProductTranslation(
      Number(parent.id),
      locale,
    );
    return translation?.description;
  }

  @ResolveField()
  async translations(@Parent() parent: Product) {
    return await this.productService.getProductTranslations(Number(parent.id));
  }

  @ResolveField()
  async views(@Parent() parent: Product) {
    return await this.productService.countProductViews(Number(parent.id));
  }

  @ResolveField()
  async viewsLast14Days(@Parent() parent: Product) {
    return await this.productService.countProductViewsLast14Days(
      Number(parent.id),
    );
  }

  @ResolveField()
  async discountForPaymentFromTheBalance(
    @Parent() product: Product,
    @Context('req') req: Request,
    @CtxCurrency() currency: Currency,
  ) {
    if (!req.headers.authorization) return null;

    try {
      const user = await this.authGuard.getUserByAuthHeader(
        req.headers.authorization,
      );
      const gameCategory = await this.gameCategoryService.findById(
        Number(product.gameCategoryId),
      );
      const finance = await this.financeService.findOrCreate({
        userId: user.id,
      });

      if (product.price && gameCategory) {
        const productPrice = await this.currencyService.convert(
          product.price,
          product.currency,
          Currency.RUB,
        );
        const discount =
          (Number(productPrice) *
            Number(gameCategory.discountForBalancePayment)) /
          100;

        const result = Math.min(finance?.hiddenBalanceInRub || 0, discount);

        return await this.currencyService.convert(
          result,
          Currency.RUB,
          currency,
        );
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }
}
