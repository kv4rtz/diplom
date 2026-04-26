import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'crypto';
import ExcelJS from 'exceljs';
import { type Request } from 'express';
import {
  FindOptions,
  IncludeOptions,
  Op,
  Order,
  Sequelize,
  Transaction,
  UniqueConstraintError,
  WhereOptions,
} from 'sequelize';
import slug from 'slug';
import { AuthGuard } from 'src/auth/auth.guard';
import { BgrService } from 'src/bgr/bgr.service';
import { CommissionsService } from 'src/commissions/commissions.service';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { ErrorCause } from 'src/errors-couse';
import { GameCategoryService } from 'src/game-categories/game-categories.service';
import { GameCategoryTranslation } from 'src/game-categories/models/game-categories-translations.model';
import { GameCategory } from 'src/game-categories/models/game-categories.model';
import { GameService } from 'src/games/games.service';
import { IMAGE_MIME_TYPES } from 'src/global/constants/mime-types';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { parseOrderBy } from 'src/global/utils/parseOrderBy';
import {
  ComissionType,
  ComplaintProductStatus,
  Currency,
  Locale,
} from 'src/graphql';
import { ReviewsService } from 'src/reviews/reviews.service';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { User } from 'src/users/models/users.model';
import { UsersService } from './../users/users.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductComplaintsOptionsDto } from './dto/product-complaints-options.dto';
import {
  ProductFilterOptionInputDto,
  ProductPriceFilterInputDto,
} from './dto/product-filter-option-input.dto';
import { ProductTranslationDto } from './dto/product-translation.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { tExcel, translationsMap } from './excel-translations';
import {
  ProductComplaint,
  ProductComplaintsCreationAttrs,
} from './models/product-complaints.model';
import { ProductFavourite } from './models/product-favourites.model';
import { ProductLot } from './models/product-lots.model';
import { ProductOption } from './models/product-options.model';
import { ProductTranslation } from './models/product-translations.model';
import { ProductView } from './models/product-views.model';
import { ProductFile } from './models/products-files.model';
import { Product } from './models/products.model';

@Injectable()
export class ProductService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Product) private readonly productRepository: typeof Product,
    @InjectModel(ProductOption)
    private readonly productOptionRepository: typeof ProductOption,
    @InjectModel(ProductTranslation)
    private readonly productTranslationRepository: typeof ProductTranslation,
    private readonly storageService: StorageService,
    @InjectModel(ProductFile)
    private readonly productFileRepository: typeof ProductFile,
    @InjectModel(ProductLot)
    private readonly productLotRepository: typeof ProductLot,
    private readonly gameCategoryService: GameCategoryService,
    private readonly currenciesService: CurrenciesService,
    private readonly comissionsService: CommissionsService,
    private readonly usersService: UsersService,
    private readonly gameService: GameService,
    @InjectModel(ProductView)
    private readonly productViewRepository: typeof ProductView,
    @InjectModel(ProductFavourite)
    private readonly productFavouriteRepository: typeof ProductFavourite,
    private readonly authGuard: AuthGuard,
    private readonly reviewsService: ReviewsService,
    @InjectModel(ProductComplaint)
    private readonly productComplaintsRepository: typeof ProductComplaint,
    private readonly bgrService: BgrService,
  ) {}

  async countProductsBySellerId(sellerId: number) {
    return await this.productRepository.count({
      where: {
        sellerId,
      },
    });
  }

  async getDateWhenCanBeLiftedProduct(userId: number) {
    const currentDate = new Date();

    let lastLiftedProduct: Product | null = null;
    try {
      lastLiftedProduct = await this.productRepository.findOne({
        where: {
          sellerId: userId,
          lastLiftingAt: { [Op.not]: null },
        },
        order: [['lastLiftingAt', 'DESC NULLS LAST']],
      });
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
    }

    if (!lastLiftedProduct) return currentDate;

    if (!lastLiftedProduct.lastLiftingAt) return currentDate;

    const bgr = await this.bgrService.calcBgrByUserId(userId);
    let diffHours = 4;

    if (bgr >= 12000) diffHours = 1;
    else if (bgr >= 9500 && bgr < 12000) diffHours = 2;
    else if (bgr >= 5500 && bgr < 9500) diffHours = 3;

    const nextLiftDate = new Date(lastLiftedProduct.lastLiftingAt);
    nextLiftDate.setHours(nextLiftDate.getHours() + diffHours);

    return nextLiftDate > currentDate ? nextLiftDate : currentDate;
  }

  async canBeLiftProductsByUserId(userId: number) {
    const bgr = await this.bgrService.calcBgrByUserId(userId);
    const currentDate = new Date();

    let lastLiftedProduct: Product | null = null;
    try {
      lastLiftedProduct = await this.productRepository.findOne({
        where: {
          sellerId: userId,
          lastLiftingAt: { [Op.not]: null },
        },
        order: [['lastLiftingAt', 'DESC NULLS LAST']],
      });
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
    }

    if (!lastLiftedProduct?.lastLiftingAt) {
      return true;
    }

    const lastLiftDate = new Date(lastLiftedProduct.lastLiftingAt);
    const diffMs = currentDate.getTime() - lastLiftDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (bgr >= 12000) return diffHours >= 1;
    if (bgr >= 9500 && bgr < 12000) return diffHours >= 2;
    if (bgr >= 5500 && bgr < 9500) return diffHours >= 3;
    return diffHours >= 4;
  }

  async liftMyProducts(ids: number[], userId: number) {
    const canBeLift = await this.canBeLiftProductsByUserId(userId);
    if (!canBeLift)
      throw new BadRequestException(ErrorCause.CANNOT_LIFT_PRODUCT);

    const productsLifted: number[] = [];

    const products = await this.productRepository.findAll({
      where: {
        id: { [Op.in]: ids },
        sellerId: userId,
      },
    });

    const currentDate = new Date();

    for await (const product of products) {
      product.lastLiftingAt = currentDate;
      await product.save();
      productsLifted.push(product.id);
    }

    return productsLifted;
  }

  async findProductComplaintsWithPagination(
    options: ProductComplaintsOptionsDto & { pageInfo: PageInfoDto },
  ) {
    const { page = 1, limit = 20 } = options.pageInfo;

    const offset = (page - 1) * limit;

    const where: WhereOptions<ProductComplaint> = {};
    if (options.productId) where.productId = options.productId;
    if (options.status) where.status = options.status;
    if (options.userId) where.userId = options.userId;

    const include: IncludeOptions[] = [];
    if (options.sellerId) {
      include.push({
        model: Product,
        required: true,
        where: {
          sellerId: options.sellerId,
        },
      });
    }

    const { rows, count } =
      await this.productComplaintsRepository.findAndCountAll({
        where,
        limit,
        offset,
        distinct: true,
        include,
        order: options.order
          ? [parseOrderBy(options.order)]
          : [['createdAt', 'DESC']],
      });

    return {
      pages: Math.ceil(count / limit),
      count,
      rows,
    };
  }

  async approveComplaint(id: number) {
    return await this.productComplaintsRepository.update(
      { status: ComplaintProductStatus.APPROVED },
      { where: { id } },
    );
  }

  async rejectComplaint(id: number) {
    return await this.productComplaintsRepository.update(
      { status: ComplaintProductStatus.REJECTED },
      { where: { id } },
    );
  }

  async createComplaintProduct(attrs: ProductComplaintsCreationAttrs) {
    return await this.productComplaintsRepository.create(attrs);
  }

  async getAllByGlobalCategoryId(globalCategoryId: number) {
    return await this.productRepository.findAll({
      where: { active: true },
      include: [
        {
          model: GameCategory,
          required: true,
          where: { globalCategoryId },
        },
      ],
    });
  }

  async deleteProduct(id: number, userId: number) {
    const product = await this.productRepository.findByPk(id);

    const hasAdminPermission = this.usersService.hasPermissions(userId, [
      'admin.products.delete',
    ]);

    if (!hasAdminPermission && product!.sellerId !== userId)
      throw new ForbiddenException(ErrorCause.FORBIDDEN);

    await product?.destroy();

    return true;
  }

  async countActiveProducts() {
    return await this.productRepository.count({ where: { active: true } });
  }

  async lastViewedMyProductsByUserId(userId: number, sellerId: number) {
    const result: {
      watchingItRightNow: Product | null;
      watchedThreeProducts: Product[] | null;
    } = {
      watchingItRightNow: null,
      watchedThreeProducts: null,
    };

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    let pw: ProductView | null = null;

    try {
      pw = await this.productViewRepository.findOne({
        where: {
          userId,
          updatedAt: { [Op.gte]: tenMinutesAgo },
        },
        include: [{ model: Product, required: true, where: { sellerId } }],
        order: [['updatedAt', 'DESC']],
      });

      result.watchingItRightNow = pw!.product;
    } catch (e) {
      if (e instanceof NotFoundException) result.watchingItRightNow = null;
      else throw e;
    }

    try {
      const pws = await this.productViewRepository.findAll({
        where: {
          userId,
          updatedAt: { [Op.lt]: pw ? pw.updatedAt : tenMinutesAgo },
        },
        include: [{ model: Product, required: true, where: { sellerId } }],
        order: [['updatedAt', 'DESC']],
        limit: 3,
      });

      result.watchedThreeProducts = pws.map((pw) => pw.product);
    } catch (e) {
      if (e instanceof NotFoundException) result.watchedThreeProducts = null;
      else throw e;
    }

    return result;
  }

  async checkProductInFavourites(productId: number, userId: number) {
    try {
      const pf = await this.productFavouriteRepository.findOne({
        where: { productId, userId },
      });
      return Boolean(pf);
    } catch {
      return false;
    }
  }

  async countProductFavouritesByUserId(userId: number) {
    return await this.productFavouriteRepository.count({ where: { userId } });
  }

  async addProductToFavourites(productId: number, userId: number) {
    try {
      const pf = await this.productFavouriteRepository.create({
        productId,
        userId,
      });
      return Boolean(pf);
    } catch (e) {
      if (e instanceof UniqueConstraintError)
        throw new BadRequestException(ErrorCause.PRODUCT_ALREADY_FAVOURITED);
      throw e;
    }
  }

  async removeProductFromFavourites(productId: number, userId: number) {
    const pf = await this.productFavouriteRepository.findOne({
      where: { productId, userId },
    });
    await pf?.destroy();
    return true;
  }

  async addProductView(productId: number, ip: string, userId?: number) {
    try {
      const product = await this.productRepository.findByPk(productId);

      if (!product?.active) return;

      const find = await this.productViewRepository.findOne({
        where: { productId, [Op.or]: [{ ip }, { userId }] },
        // @ts-ignore
        hooks: false,
      });
      if (find) {
        // ? ПОЛЕ "updatedAt" НЕ ОБНОВЛЯЛОСЬ ЧЕРЕЗ ОБЫЧНЫЙ UPDATE ПОЧЕМУ-ТО
        await this.sequelize.query(
          `UPDATE "product_views" SET "updatedAt" = :updatedAt, "userId" = :userId, "ip" = :ip WHERE "product_views"."id" = :id`,
          {
            replacements: {
              id: find.id,
              updatedAt: new Date(),
              userId,
              ip,
            },
          },
        );
        return await find.reload();
      } else {
        return await this.productViewRepository.create({
          productId,
          ip,
          userId,
        });
      }
    } catch (error) {
      return null;
    }
  }

  async countProductViews(productId: number) {
    return await this.productViewRepository.count({
      where: {
        productId,
      },
    });
  }

  async countProductViewsLast14Days(productId: number) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    return await this.productViewRepository.count({
      where: {
        productId,
        updatedAt: {
          [Op.gte]: fourteenDaysAgo,
        },
      },
    });
  }

  async findUserProductsWithPagination(
    dto: PageInfoDto,
    userId: number,
    search?: string,
    autoDelivery?: boolean,
    hasReviews?: boolean,
    filters?: ProductFilterOptionInputDto[],
    priceFilter?: ProductPriceFilterInputDto,
    gameCategoryId?: number,
    globalCategoryId?: number,
    gameId?: number,
    firstOrderBy?: string,
    secondOrderBy?: string,
    active?: boolean,
    targetCurrency?: Currency,
    mostViewedFirst?: Boolean,
  ) {
    const { page = 1, limit = 20 } = dto;

    const offset = (page - 1) * limit;

    const useIdFilters =
      !!search || (filters !== undefined && filters.length > 0) || hasReviews;
    const sources: number[][] = [];

    if (search)
      sources.push((await this.getProductIdsBySearch(search)) as number[]);
    if (filters !== undefined && filters.length > 0)
      sources.push((await this.getProductIdsByFilters(filters)) as number[]);
    if (hasReviews)
      sources.push(await this.reviewsService.getProductIdsWithReviews());

    let intersectIds: number[] = [];
    if (sources.length > 0) {
      intersectIds = sources.reduce(
        (acc, arr) => acc.filter((id) => arr.includes(id)),
        sources[0],
      );
    }

    const and: Array<any> = [];

    if (priceFilter) {
      const [rubCurrency, usdCurrency, eurCurrency] = await Promise.all([
        this.currenciesService.getCurrencyValue(Currency.RUB),
        this.currenciesService.getCurrencyValue(Currency.USD),
        this.currenciesService.getCurrencyValue(Currency.EUR),
      ]);

      let targetCurrencyValue = 1;
      if (targetCurrency === Currency.RUB)
        targetCurrencyValue = rubCurrency!.value;
      if (targetCurrency === Currency.USD)
        targetCurrencyValue = usdCurrency!.value;
      if (targetCurrency === Currency.EUR)
        targetCurrencyValue = eurCurrency!.value;

      const convertToCurrency = `
        CASE 
          WHEN "Product"."currency" = 'RUB' THEN "Product"."price" * ${rubCurrency!.value / targetCurrencyValue} * ${this.comissionsService.calcMinCostSql(Currency.RUB, ComissionType.REPLENISHMENT)}
          WHEN "Product"."currency" = 'USD' THEN "Product"."price" * ${usdCurrency!.value / targetCurrencyValue} * ${this.comissionsService.calcMinCostSql(Currency.USD, ComissionType.REPLENISHMENT)}
          WHEN "Product"."currency" = 'EUR' THEN "Product"."price" * ${eurCurrency!.value / targetCurrencyValue} * ${this.comissionsService.calcMinCostSql(Currency.EUR, ComissionType.REPLENISHMENT)}
          ELSE "Product"."price"
        END
      `;

      if (priceFilter?.max) {
        and.push(
          Sequelize.where(Sequelize.literal(convertToCurrency), {
            [Op.lte]: priceFilter.max,
          }),
        );
      }
      if (priceFilter?.min) {
        and.push(
          Sequelize.where(Sequelize.literal(convertToCurrency), {
            [Op.gte]: priceFilter.min,
          }),
        );
      }
    }

    const whereProduct: WhereOptions<Product> = {
      ...(useIdFilters ? { id: intersectIds } : {}),
      ...(autoDelivery !== undefined ? { autoDelivery } : {}),
      ...(gameCategoryId ? { gameCategoryId } : {}),
      ...(typeof active === 'boolean' ? { active } : {}),
      sellerId: userId,
    };

    if (and.length > 0)
      Object.assign(whereProduct, {
        [Op.and]: and,
      });

    const whereGameCategory: WhereOptions<GameCategory> = {
      ...(globalCategoryId ? { globalCategoryId } : {}),
      ...(gameId ? { gameId } : {}),
    };

    const include = [
      { model: GameCategory, required: true, where: whereGameCategory },
    ];

    let convertToCurrency = '';

    const order: Order = [];

    if (firstOrderBy?.includes('price')) {
      const rubCurrency = await this.currenciesService.getCurrencyValue(
        Currency.RUB,
      );
      const usdCurrency = await this.currenciesService.getCurrencyValue(
        Currency.USD,
      );
      const eurCurrency = await this.currenciesService.getCurrencyValue(
        Currency.EUR,
      );

      let targetCurrencyValue = 1;
      if (targetCurrency === Currency.RUB)
        targetCurrencyValue = rubCurrency!.value;
      if (targetCurrency === Currency.USD)
        targetCurrencyValue = usdCurrency!.value;
      if (targetCurrency === Currency.EUR)
        targetCurrencyValue = eurCurrency!.value;

      convertToCurrency = `
        CASE 
          WHEN "Product"."currency" = 'RUB' THEN "Product"."price" * ${rubCurrency!.value / targetCurrencyValue}
          WHEN "Product"."currency" = 'USD' THEN "Product"."price" * ${usdCurrency!.value / targetCurrencyValue}
          WHEN "Product"."currency" = 'EUR' THEN "Product"."price" * ${eurCurrency!.value / targetCurrencyValue}
          ELSE "Product"."price"
        END
      `;

      order.push([
        Sequelize.literal(convertToCurrency),
        firstOrderBy?.includes('desc') ? 'desc' : 'asc',
      ]);
    }

    if (firstOrderBy && !order.length) order.push(parseOrderBy(firstOrderBy));
    if (secondOrderBy) order.push(parseOrderBy(secondOrderBy));

    const { rows, count } = await this.productRepository.findAndCountAll({
      limit,
      offset,
      distinct: true,
      where: whereProduct,
      include: Object.keys(whereGameCategory).length ? include : [],
      order,
    });

    return {
      rows,
      count,
      games: await this.gameService.findGamesBySellerId(userId),
      gameCategories:
        await this.gameCategoryService.findGameCategoriesBySellerId(userId),
      pages: Math.ceil(count / limit),
    };
  }

  async getProductFileKeys(productId: number) {
    return await this.productFileRepository.findAll({
      where: { productId },
    });
  }

  async getProductLots(productId: number) {
    return await this.productLotRepository.findAll({
      where: { productId },
    });
  }

  async getProductLotById(id: number) {
    return await this.productLotRepository.findByPk(id);
  }

  async countProductsByGameId(gameId: number) {
    const gameCategories =
      await this.gameCategoryService.getGameCategoriesByGameId(gameId);
    return await this.productRepository.count({
      distinct: true,
      col: 'id',
      where: { gameCategoryId: { [Op.in]: gameCategories.map((gc) => gc.id) } },
    });
  }

  async countProductsByGameCategoryId(gameCategoryId: number) {
    return await this.productRepository.count({
      distinct: true,
      col: 'id',
      where: { gameCategoryId },
    });
  }

  async countProductsByGameCategoryIdAndUser(
    gameCategoryId: number,
    userId: number,
    transaction?: Transaction,
  ) {
    return await this.productRepository.count({
      distinct: true,
      col: 'id',
      where: { gameCategoryId, sellerId: userId },
      transaction,
    });
  }

  async getProductOptions(productId: number) {
    return await this.productOptionRepository.findAll({
      where: { productId },
    });
  }

  async getProductTranslation(productId: number, locale: Locale) {
    return await this.productTranslationRepository.findOne({
      where: { productId, locale },
    });
  }

  async getProductTranslations(productId: number) {
    return await this.productTranslationRepository.findAll({
      where: { productId },
    });
  }

  async getProductIdsBySearch(search?: string) {
    if (search) {
      const matchingIds = await ProductTranslation.findAll({
        attributes: ['productId'],
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
          ],
        },
        raw: true,
      });

      const ids = matchingIds.map((t) => t.productId);

      return ids;
    }
  }

  async getProductIdsByFilters(filters?: ProductFilterOptionInputDto[]) {
    if (!filters?.length) return;

    const filterConditions = filters.map((filter) => {
      const conditions: any[] = [];

      if (filter.equals !== undefined) {
        conditions.push({ value: filter.equals });
      }

      if (filter.min !== undefined || filter.max !== undefined) {
        const rangeConditions: any[] = [];
        if (filter.min !== undefined) {
          rangeConditions.push(
            Sequelize.literal(
              `"ProductOption"."value" ~ '^[0-9]+$' AND CAST("ProductOption"."value" AS INTEGER) >= ${filter.min}`,
            ),
          );
        }
        if (filter.max !== undefined) {
          rangeConditions.push(
            Sequelize.literal(
              `"ProductOption"."value" ~ '^[0-9]+$' AND CAST("ProductOption"."value" AS INTEGER) <= ${filter.max}`,
            ),
          );
        }
        conditions.push({ [Op.and]: rangeConditions });
      }

      return {
        gameCategoryOptionId: filter.gameCategoryOptionId,
        [Op.or]: conditions,
      };
    });

    const productOptions = await this.productOptionRepository.findAll({
      attributes: ['productId', 'gameCategoryOptionId'],
      where: { [Op.or]: filterConditions },
      raw: true,
    });

    const productMap = new Map<number, Set<number>>();
    for (const opt of productOptions) {
      if (!productMap.has(opt.productId)) {
        productMap.set(opt.productId, new Set());
      }
      productMap.get(opt.productId)?.add(opt.gameCategoryOptionId);
    }

    const productIds = Array.from(productMap.entries())
      .filter(([_, optionIds]) =>
        filters.every((f) => optionIds.has(f.gameCategoryOptionId)),
      )
      .map(([productId]) => productId);

    return productIds;
  }

  async findAllWithPagination(
    dto: PageInfoDto,
    search?: string,
    sellerOnline?: boolean,
    autoDelivery?: boolean,
    hasReviews?: boolean,
    filters?: ProductFilterOptionInputDto[],
    priceFilter?: ProductPriceFilterInputDto,
    sellerId?: number,
    gameCategoryId?: number,
    globalCategoryId?: number,
    gameId?: number,
    firstOrderBy?: string,
    secondOrderBy?: string,
    active?: boolean,
    targetCurrency?: Currency,
    isFavourite?: boolean,
    req?: Request,
    mostViewedFirst?: Boolean,
  ) {
    const { page = 1, limit = 20 } = dto;

    const offset = (page - 1) * limit;

    const favouriteIds: number[] = [];

    if (isFavourite && req) {
      if (req.headers.authorization) {
        try {
          const user = await this.authGuard.getUserByAuthHeader(
            req.headers.authorization,
          );

          const pf = await this.productFavouriteRepository.findAll({
            where: { userId: user.id },
          });

          favouriteIds.push(...pf.map((f) => f.productId));
        } catch {}
      }
    }

    const useIdFilters =
      !!search || (filters !== undefined && filters.length > 0) || hasReviews;
    const sources: number[][] = [];

    if (search)
      sources.push((await this.getProductIdsBySearch(search)) as number[]);
    if (filters !== undefined && filters.length > 0)
      sources.push((await this.getProductIdsByFilters(filters)) as number[]);
    if (hasReviews)
      sources.push(await this.reviewsService.getProductIdsWithReviews());

    let intersectIds: number[] = [];
    if (sources.length > 0) {
      intersectIds = sources.reduce(
        (acc, arr) => acc.filter((id) => arr.includes(id)),
        sources[0],
      );
    }

    const and: Array<any> = [];

    if (priceFilter) {
      const [rubCurrency, usdCurrency, eurCurrency] = await Promise.all([
        this.currenciesService.getCurrencyValue(Currency.RUB),
        this.currenciesService.getCurrencyValue(Currency.USD),
        this.currenciesService.getCurrencyValue(Currency.EUR),
      ]);

      let targetCurrencyValue = 1;
      if (targetCurrency === Currency.RUB)
        targetCurrencyValue = rubCurrency!.value;
      if (targetCurrency === Currency.USD)
        targetCurrencyValue = usdCurrency!.value;
      if (targetCurrency === Currency.EUR)
        targetCurrencyValue = eurCurrency!.value;

      const convertToCurrency = `
        CASE 
          WHEN "Product"."currency" = 'RUB' THEN "Product"."price" * ${rubCurrency!.value / targetCurrencyValue} * ${this.comissionsService.calcMinCostSql(Currency.RUB, ComissionType.REPLENISHMENT)}
          WHEN "Product"."currency" = 'USD' THEN "Product"."price" * ${usdCurrency!.value / targetCurrencyValue} * ${this.comissionsService.calcMinCostSql(Currency.USD, ComissionType.REPLENISHMENT)}
          WHEN "Product"."currency" = 'EUR' THEN "Product"."price" * ${eurCurrency!.value / targetCurrencyValue} * ${this.comissionsService.calcMinCostSql(Currency.EUR, ComissionType.REPLENISHMENT)}
          ELSE "Product"."price"
        END
      `;

      if (priceFilter?.max) {
        and.push(
          Sequelize.where(Sequelize.literal(convertToCurrency), {
            [Op.lte]: priceFilter.max,
          }),
        );
      }
      if (priceFilter?.min) {
        and.push(
          Sequelize.where(Sequelize.literal(convertToCurrency), {
            [Op.gte]: priceFilter.min,
          }),
        );
      }
    }

    const whereProduct: WhereOptions<Product> = {
      ...(useIdFilters ? { id: intersectIds } : {}),
      ...(autoDelivery !== undefined ? { autoDelivery } : {}),
      ...(sellerId ? { sellerId } : {}),
      ...(gameCategoryId ? { gameCategoryId } : {}),
    };

    if (and.length > 0)
      Object.assign(whereProduct, {
        [Op.and]: and,
      });

    if (isFavourite && Array.isArray(whereProduct?.id?.[Op.in])) {
      whereProduct.id = {
        [Op.in]: favouriteIds.filter((id) =>
          whereProduct.id[Op.in].includes(id),
        ),
      };
    }
    if (isFavourite && !Array.isArray(whereProduct?.id?.[Op.in])) {
      whereProduct.id = {
        [Op.in]: favouriteIds,
      };
    }

    whereProduct.active = true;
    if (typeof active === 'boolean') whereProduct.active = active;

    const whereGameCategory: WhereOptions<GameCategory> = {
      ...(globalCategoryId ? { globalCategoryId } : {}),
      ...(gameId ? { gameId } : {}),
    };

    const include = [
      { model: GameCategory, required: true, where: whereGameCategory },
    ];

    let convertToCurrency = '';
    const order: Order = [];

    if (mostViewedFirst) {
      order.push([
        Sequelize.literal(`(
        SELECT COUNT(*) 
        FROM ${ProductView.getTableName()} AS "views" 
        WHERE "views"."productId" = "Product"."id"
      )`),
        'desc',
      ]);
    }

    if (firstOrderBy?.includes('price')) {
      const rubCurrency = await this.currenciesService.getCurrencyValue(
        Currency.RUB,
      );
      const usdCurrency = await this.currenciesService.getCurrencyValue(
        Currency.USD,
      );
      const eurCurrency = await this.currenciesService.getCurrencyValue(
        Currency.EUR,
      );

      let targetCurrencyValue = 1;
      if (targetCurrency === Currency.RUB)
        targetCurrencyValue = rubCurrency!.value;
      if (targetCurrency === Currency.USD)
        targetCurrencyValue = usdCurrency!.value;
      if (targetCurrency === Currency.EUR)
        targetCurrencyValue = eurCurrency!.value;

      convertToCurrency = `
        CASE 
          WHEN "Product"."currency" = 'RUB' THEN "Product"."price" * ${rubCurrency!.value / targetCurrencyValue}
          WHEN "Product"."currency" = 'USD' THEN "Product"."price" * ${usdCurrency!.value / targetCurrencyValue}
          WHEN "Product"."currency" = 'EUR' THEN "Product"."price" * ${eurCurrency!.value / targetCurrencyValue}
          ELSE "Product"."price"
        END
      `;

      order.push([
        Sequelize.literal(convertToCurrency),
        firstOrderBy?.includes('desc') ? 'desc' : 'asc',
      ]);
    }

    if (firstOrderBy && !order.length) order.push(parseOrderBy(firstOrderBy));
    if (secondOrderBy) order.push(parseOrderBy(secondOrderBy));

    const { rows, count } = await this.productRepository.findAndCountAll({
      limit,
      offset,
      distinct: true,
      where: whereProduct,
      include: [
        {
          model: User,
          where: sellerOnline ? { isOnline: sellerOnline } : undefined,
          required: true,
        },
        ...(Object.keys(whereGameCategory).length ? include : []),
      ],
      order:
        (order.length === 1 && mostViewedFirst) || order.length == 0
          ? [['lastLiftingAt', 'DESC NULLS LAST'], ...order]
          : order,
    });

    return {
      rows,
      count,
      games: await this.gameService.getGamesWithProducts(sellerId),
      gameCategories:
        await this.gameCategoryService.getGameCategoriesWithProducts(sellerId),
      pages: Math.ceil(count / limit),
    };
  }

  async findById(id: number, options?: Omit<FindOptions<Product>, 'where'>) {
    return await this.productRepository.findByPk(id, options);
  }

  async validateProduct(
    dto: CreateProductDto,
    userId: number,
    currency: Currency,
    transaction?: Transaction,
  ) {
    console.log(dto.gameCategoryId);

    const gameCategory = await this.gameCategoryService.findById(
      dto.gameCategoryId,
      transaction,
    );

    // if (gameCategory?.allowScreenshotsInProduct && !dto.images.length) {
    //   throw new BadRequestException(ErrorCause.REQUIRED_IMAGES);
    // }

    const convetedPriceToRub = await this.currenciesService.convert(
      dto.price,
      currency,
      Currency.RUB,
      transaction,
    );

    if (convetedPriceToRub > 300000) {
      throw new BadRequestException(ErrorCause.PRICE_EXCEEDS_LIMIT);
    }

    if (convetedPriceToRub < gameCategory!.minOrderPrice) {
      throw new BadRequestException(ErrorCause.SMALL_PRICE_FOR_GAME_CATEGORY);
    }

    const count = await this.countProductsByGameCategoryIdAndUser(
      dto.gameCategoryId,
      userId,
      transaction,
    );

    if (count >= gameCategory!.productsQuantityByUser) {
      throw new BadRequestException(
        ErrorCause.TOO_MANY_PRODUCTS_IN_GAME_CATEGORY,
      );
    }

    const user = await this.usersService.getUserById(userId, { transaction });
    if (gameCategory?.sellerVerifiedPhone && !user?.phone) {
      throw new BadRequestException(ErrorCause.REQUIRED_VERIFICATION_PHONE);
    }
    if (gameCategory?.sellerVerfiedIdentity && !user?.verifiedIdentity) {
      throw new BadRequestException(ErrorCause.REQUIRED_VERIFICATION_IDENTITY);
    }
  }

  async createProduct(
    dto: CreateProductDto,
    userId: number,
    currency?: Currency,
  ) {
    return await this.sequelize.transaction(async (transaction) => {
      await this.validateProduct(dto, userId, currency!, transaction);

      const sl = slug(dto.translations[0].name!);

      const product = await this.productRepository.create(
        {
          ...dto,
          slug: `${sl}-${randomUUID().split('-').at(-1)}`,
          sellerId: userId,
          currency,
        },
        { include: [ProductOption, ProductTranslation], transaction },
      );

      // Меняем слаг
      await product.update(
        { slug: `${sl}-${product.id}` },
        { transaction, silent: true },
      );

      const imageKeys: string[] = [];

      if (dto.images) {
        for (const image of dto.images) {
          const isExists = await this.storageService.fileExists(
            image,
            StorageBuckets.BannersAndIcons,
          );
          if (!isExists) throw new NotFoundException(ErrorCause.FILE_NOT_FOUND);
          const isValid = await this.storageService.checkFileMimeType(
            image,
            IMAGE_MIME_TYPES,
            StorageBuckets.BannersAndIcons,
          );
          if (!isValid)
            throw new BadRequestException(ErrorCause.FILE_INCORRECT_MIME_TYPE);

          imageKeys.push(image);
        }
      }

      if (dto.lots) {
        await this.productLotRepository.bulkCreate(
          dto.lots.map((lot) => ({
            productId: product.id,
            text: lot,
          })),
          {
            transaction,
          },
        );
      }

      await this.productFileRepository.bulkCreate(
        imageKeys.map((key) => ({
          productId: product.id,
          fileKey: key,
        })),
        { transaction },
      );

      return await product.reload({ transaction });
    });
  }

  async getAvailableLot(productId: number, transaction?: Transaction) {
    return await this.productLotRepository.findOne({
      where: { productId },
      transaction,
    });
  }

  private async checkPermissionsForUpdateProduct(
    userId: number,
    sellerId: number,
    transaction?: Transaction,
  ) {
    const hasUserPermission = await this.usersService.hasPermissions(
      userId,
      ['products.update'],
      { transaction },
    );

    const hasAdminPermission = await this.usersService.hasPermissions(
      userId,
      ['admin.products.update'],
      { transaction },
    );

    if (hasAdminPermission) return true;
    if (hasUserPermission && sellerId === userId) return true;

    return false;
  }

  async updateProduct(id: number, dto: UpdateProductDto, userId: number) {
    return await this.sequelize.transaction(async (transaction) => {
      const product = await this.productRepository.findByPk(id, {
        transaction,
      });

      if (
        !(await this.checkPermissionsForUpdateProduct(
          userId,
          product!.sellerId,
          transaction,
        ))
      ) {
        throw new ForbiddenException(ErrorCause.FORBIDDEN);
      }

      let sl: string | undefined;

      if (dto.translations) sl = slug(dto.translations[0].name! + `-${id}`);

      await product?.update(
        {
          autoDelivery: dto.autoDelivery,
          gameCategoryId: dto.gameCategoryId,
          price: dto.price,
          quantity: dto.quantity,
          active: dto.active,
          slug: sl,
          deactiveAfterSell: dto.deactiveAfterSell,
        },
        { transaction },
      );

      if (dto.translations) {
        await this.productTranslationRepository.destroy({
          where: { productId: id },
          transaction,
        });
        await this.productTranslationRepository.bulkCreate(
          dto.translations.map((t) => ({
            ...t,
            productId: id,
          })),
          { transaction },
        );
      }

      if (dto.options) {
        await this.productOptionRepository.destroy({
          where: { productId: id },
          transaction,
        });
        await this.productOptionRepository.bulkCreate(
          dto.options.map((o) => ({
            ...o,
            productId: id,
          })),
          { transaction },
        );
      }

      if (dto.lots) {
        await this.productLotRepository.destroy({
          where: { productId: id },
          transaction,
        });
        await this.productLotRepository.bulkCreate(
          dto.lots.map((lot) => ({
            productId: id,
            text: lot,
          })),
          { transaction },
        );
      }

      if (dto.images) {
        await this.productFileRepository.destroy({
          where: { productId: id },
          transaction,
        });

        const imageKeys: string[] = [];

        for (const image of dto.images) {
          const isExists = await this.storageService.fileExists(
            image,
            StorageBuckets.BannersAndIcons,
          );
          if (!isExists) throw new NotFoundException(ErrorCause.FILE_NOT_FOUND);
          const isValid = await this.storageService.checkFileMimeType(
            image,
            IMAGE_MIME_TYPES,
            StorageBuckets.BannersAndIcons,
          );
          if (!isValid)
            throw new BadRequestException(ErrorCause.FILE_INCORRECT_MIME_TYPE);

          imageKeys.push(image);
        }

        await this.productFileRepository.bulkCreate(
          imageKeys.map((key) => ({
            productId: id,
            fileKey: key,
          })),
          { transaction },
        );
      }

      return await product?.reload({ transaction });
    });
  }

  async copyProduct(id: number, userId: number) {
    return await this.sequelize.transaction(async (transaction) => {
      const [original, lots] = await Promise.all([
        this.productRepository.findOne({
          attributes: {
            exclude: ['id', 'active', 'createdAt', 'updatedAt', 'deletedAt'],
          },
          where: {
            id,
            sellerId: userId,
          },
          include: [
            {
              model: ProductOption,
              attributes: {
                exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'],
              },
            },
            {
              model: ProductTranslation,
              attributes: {
                exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'],
              },
            },
            {
              model: ProductFile,
              attributes: {
                exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'],
              },
            },
            // {
            //   model: ProductLot,
            //   attributes: {
            //     exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'],
            //   },
            // },
          ],
          transaction,
          // @ts-ignore
          hooks: false,
        }),
        await this.productLotRepository.findAll({
          where: {
            productId: id,
          },
          attributes: {
            exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt'],
          },
          transaction,
        }),
      ]);

      if (!original) throw new NotFoundException(ErrorCause.PRODUCT_NOT_FOUND);

      const dto = new CreateProductDto();
      dto.active = false;
      dto.autoDelivery = original.autoDelivery;
      dto.deactiveAfterSell = original.deactiveAfterSell;
      dto.gameCategoryId = original.gameCategoryId;
      dto.price = original.price;
      dto.quantity = original.quantity;
      dto.options = original.options;
      dto.images = original.filesKeys.map(({ fileKey }) => fileKey);
      dto.lots = lots.map(({ text }) => text);
      const copyTextMap = {
        RU: ' (Копия)',
        EN: ' (Copy)',
        DE: ' (Kopie)',
      };
      dto.translations = original.translations.map((t) => ({
        locale: t.locale,
        name:
          t.name +
          copyTextMap[t.locale.toLocaleUpperCase() as keyof typeof copyTextMap],
        description: t.description,
        messageForBuyer: t?.messageForBuyer,
      }));

      await this.validateProduct(dto, userId, original.currency, transaction);

      const sl = slug(dto.translations[0].name);

      const copy = await this.productRepository.create(
        {
          ...dto,
          slug: `${sl}-${randomUUID().split('-').at(-1)}`,
          sellerId: userId,
          currency: original.currency,
        },
        {
          transaction,
          include: [ProductOption, ProductTranslation],
        },
      );

      await copy.update(
        {
          slug: `${sl}-${copy.id}`,
        },
        { transaction, silent: true },
      );

      if (dto.images) {
        const keys = await this.storageService.makeCopyFiles(
          dto.images.map((image) => ({
            fileKey: image,
            bucket: StorageBuckets.BannersAndIcons,
          })),
        );
        await this.productFileRepository.bulkCreate(
          keys.map((key) => ({
            productId: copy.id,
            fileKey: key,
          })),
          { transaction },
        );
      }

      if (dto.lots) {
        await this.productLotRepository.bulkCreate(
          dto.lots.map((lot) => ({
            productId: copy.id,
            text: lot,
          })),
          { transaction },
        );
      }

      return await copy.reload({ transaction });
    });
  }

  async importProductsFromExcel(
    buffer: Buffer,
    userId: number,
  ): Promise<{
    createdCount: number;
    created: number[];
    errors: { row: number; error: string }[];
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const worksheet = workbook.getWorksheet('Products');
    if (!worksheet)
      throw new BadRequestException('Worksheet "Products" not found');

    const errors: { row: number; error: string }[] = [];
    const created: number[] = [];

    const headerRow = worksheet.getRow(1);
    const headerValues: string[] = Array.isArray(headerRow.values)
      ? headerRow.values.slice(1).map((h) => String(h ?? '').trim())
      : Object.values(headerRow.values).map((h) => String(h ?? '').trim());

    const universalHeaderMap: Record<string, keyof typeof translationsMap> = {};
    for (const key of Object.keys(
      translationsMap,
    ) as (keyof typeof translationsMap)[]) {
      for (const locale of ['RU', 'EN', 'DE'] as const) {
        universalHeaderMap[translationsMap[key][locale]] = key;
      }
    }

    // 🔹 Получаем значение ячейки по ключу DTO
    const getCell = (row: ExcelJS.Row, key: keyof typeof translationsMap) => {
      const colIndex = headerValues.findIndex(
        (h) => universalHeaderMap[h] === key,
      );
      if (colIndex === -1) return null;
      const cell = row.getCell(colIndex + 1).value;
      if (cell == null) return null;
      if (typeof cell === 'object' && 'text' in cell) return cell.text;
      return cell;
    };

    const toBool = (v: any) =>
      v === true || v === 'true' || v === 1 || v === '1' || v === 'TRUE';
    const toNumber = (v: any) =>
      v === null || v === undefined || v === '' ? undefined : Number(v);

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);

      try {
        const translations: ProductTranslationDto[] = ['ru', 'en', 'de']
          .map((locale) => {
            const nameKey = `name_${locale}` as keyof typeof translationsMap;
            const descKey =
              `description_${locale}` as keyof typeof translationsMap;

            const name = getCell(row, nameKey)?.toString()?.trim() || '';
            const description = getCell(row, descKey)?.toString()?.trim() || '';

            return { locale: locale as Locale, name, description };
          })
          .filter((t) => t.name);

        const currencyFromExcel = getCell(row, 'currency')
          ?.toString()
          ?.trim() as Currency;
        const currency = currencyFromExcel || Currency.RUB;

        const dto: CreateProductDto = {
          gameCategoryId: Number(getCell(row, 'gameCategoryId')) || 0,
          price: Number(getCell(row, 'price')) || 0,
          autoDelivery: toBool(getCell(row, 'autoDelivery')),
          translations,
          quantity: toNumber(getCell(row, 'quantity')) || 0,
          active: toBool(getCell(row, 'active')),
          deactiveAfterSell: toBool(getCell(row, 'deactiveAfterSell')),
          images:
            getCell(row, 'imageKeys')
              ?.toString()
              .split(', ')
              .map((k) => k.trim())
              .filter(Boolean) || [],
          lots:
            getCell(row, 'lots')
              ?.toString()
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean) || [],
          options: [],
        };

        const product = await this.createProduct(dto, userId, currency);
        created.push(product.id);
      } catch (e: any) {
        console.log(e);

        errors.push({ row: i, error: e?.message || 'Unknown error' });
      }
    }

    return {
      createdCount: created.length,
      created,
      errors,
    };
  }

  async exportProductsToExcel(ids: number[], userId: number, locale: Locale) {
    const products = await this.productRepository.findAll({
      where: { id: { [Op.in]: ids }, sellerId: userId },
      include: [
        {
          model: GameCategory,
          attributes: ['id'],
          include: [{ model: GameCategoryTranslation, attributes: ['label'] }],
        },
        {
          model: ProductTranslation,
          attributes: ['locale', 'name', 'description'],
        },
        {
          model: ProductFile,
          attributes: ['fileKey'],
        },
        {
          model: ProductLot,
          attributes: ['text'],
        },
      ],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
      { header: tExcel('id', locale), key: 'id', width: 10 },
      { header: tExcel('price', locale), key: 'price', width: 10 },
      { header: tExcel('currency', locale), key: 'currency', width: 10 },
      {
        header: tExcel('autoDelivery', locale),
        key: 'autoDelivery',
        width: 15,
      },
      { header: tExcel('active', locale), key: 'active', width: 10 },
      {
        header: tExcel('deactiveAfterSell', locale),
        key: 'deactiveAfterSell',
        width: 15,
      },
      { header: tExcel('quantity', locale), key: 'quantity', width: 10 },
      {
        header: tExcel('gameCategoryId', locale),
        key: 'gameCategoryId',
        width: 20,
      },
      {
        header: tExcel('imageKeys', locale),
        key: 'imageKeys',
        width: 20,
      },
      {
        header: tExcel('lots', locale),
        key: 'lots',
        width: 20,
      },

      ...Object.values(Locale).flatMap((localeForLabel) => [
        {
          header: tExcel(`name_${localeForLabel}`, locale),
          key: `name_${localeForLabel}`,
          width: 30,
        },
        {
          header: tExcel(`description_${localeForLabel}`, locale),
          key: `description_${localeForLabel}`,
          width: 40,
        },
      ]),
    ];

    products.forEach((product) => {
      const row: Record<string, any> = {
        id: product.id,
        slug: product.slug,
        price: product.price,
        currency: product.currency,
        autoDelivery: product.autoDelivery,
        deactiveAfterSell: product.deactiveAfterSell,
        active: product.active,
        quantity: product.quantity,
        gameCategoryId: product.gameCategory?.id || '',
        imageKeys:
          product.filesKeys?.map((image) => image.fileKey).join(', ') || '',
        lots: product.lots?.map((lot) => lot.text).join(', ') || '',
      };

      Object.values(Locale).forEach((locale) => {
        const translation = product.translations?.find(
          (t) => t.locale === locale,
        );

        row[`name_${locale}`] = translation?.name || '';
        row[`description_${locale}`] = translation?.description || '';
      });

      worksheet.addRow(row);
    });

    return workbook.xlsx.writeBuffer();
  }
}
