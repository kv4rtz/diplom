import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import {
  FindOptions,
  IncludeOptions,
  Op,
  QueryTypes,
  Sequelize,
  Transaction,
  WhereOptions,
} from 'sequelize';
import { ChatsService } from 'src/chats/chats.service';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { CurrencyValue } from 'src/currencies/models/currency-value.model';
import { ErrorCause } from 'src/errors-couse';
import { FinanceService } from 'src/finance/finance.service';
import { GameCategoryService } from 'src/game-categories/game-categories.service';
import { GameCategory } from 'src/game-categories/models/game-categories.model';
import { GameService } from 'src/games/games.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { parseOrderBy } from 'src/global/utils/parseOrderBy';
import { Currency, Locale, MessageType, TransactionType } from 'src/graphql';
import { MessagesService } from 'src/messages/messages.service';
import { ProductLot } from 'src/products/models/product-lots.model';
import { ProductOption } from 'src/products/models/product-options.model';
import { ProductTranslation } from 'src/products/models/product-translations.model';
import { ProductFile } from 'src/products/models/products-files.model';
import { Product } from 'src/products/models/products.model';
import { ProductService } from 'src/products/products.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { OrderStatus } from './../graphql';
import { CreateOrderDto } from './dto/create-order.dto';
import { generateIdFnPlpgsql } from './models/generate-id';
import { OrderProductFileSnapshot } from './models/order-product-file-snapshot.model';
import { OrderProductOptionSnapshot } from './models/order-product-option-snapshot.model';
import { OrderProductSnapshot } from './models/order-product-snapshot.model';
import { OrderProductTranslationSnapshot } from './models/order-product-translation-snapshot.model';
import { Order, OrderCreationAttrs } from './models/orders.model';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectConnection() private readonly connection: Sequelize,
    @InjectModel(Order) private readonly orderRepository: typeof Order,
    @InjectModel(OrderProductSnapshot)
    private readonly orderProductSnapshotRepository: typeof OrderProductSnapshot,
    @InjectModel(OrderProductTranslationSnapshot)
    private readonly orderProductTranslationSnapshotRepository: typeof OrderProductTranslationSnapshot,
    @InjectModel(OrderProductOptionSnapshot)
    private readonly orderProductOptionSnapshotRepository: typeof OrderProductOptionSnapshot,
    @InjectModel(OrderProductFileSnapshot)
    private readonly orderProductFileSnapshotRepository: typeof OrderProductFileSnapshot,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    private readonly currenciesService: CurrenciesService,
    private readonly transactionsService: TransactionsService,
    private readonly financeService: FinanceService,
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
    private readonly gamesService: GameService,
    private readonly gameCategoryService: GameCategoryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    await generateIdFnPlpgsql(this.connection);
  }

  async countDaysWithoutSalesByUserId(userId: number) {
    const lastOrder = await this.orderRepository.findOne({
      where: {
        status: OrderStatus.COMPLETED,
      },
      include: [
        {
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              required: true,
              paranoid: false,
              where: { sellerId: userId },
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (!lastOrder) {
      return 999;
    }

    const today = new Date();
    const lastSaleDate = new Date(lastOrder.createdAt);

    const diffMs = today.getTime() - lastSaleDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  async getProductSnapshotFileKeys(orderId: string) {
    return await this.orderProductFileSnapshotRepository.findAll({
      where: {
        orderProductSnapshotId: orderId,
      },
    });
  }

  async getProductSnapshotOptions(orderId: string) {
    return await this.orderProductOptionSnapshotRepository.findAll({
      where: {
        orderProductSnapshotId: orderId,
      },
    });
  }

  async getOpenOrdersBySellerOrBuyer(
    user1Id: number,
    user2Id: number,
    options?: FindOptions<Order>,
  ) {
    return await this.orderRepository.findAll({
      where: {
        status: {
          [Op.in]: [OrderStatus.PENDING, OrderStatus.REOPENED],
        },
        [Op.or]: [{ buyerId: user1Id }, { buyerId: user2Id }],
      },

      include: [
        {
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              required: true,
              paranoid: false,
              where: {
                [Op.or]: [
                  {
                    sellerId: user1Id,
                  },
                  {
                    sellerId: user2Id,
                  },
                ],
              },
            },
          ],
        },
      ],

      ...options,
    });
  }

  async getProductSnapshotTranslation(orderId: string, locale: Locale) {
    return await this.orderProductTranslationSnapshotRepository.findOne({
      where: {
        orderProductSnapshotId: orderId,
        locale,
      },
    });
  }

  async getProductSnapshotAllTranslations(orderId: string) {
    return await this.orderProductTranslationSnapshotRepository.findAll({
      where: {
        orderProductSnapshotId: orderId,
      },
    });
  }

  async getProductSnapshotByOrderId(orderId: string) {
    return await this.orderProductSnapshotRepository.findOne({
      where: {
        orderId,
      },
    });
  }

  async findByIdAndUserId(userId: number, orderId: string) {
    const order = await this.orderRepository.findByPk(orderId, {
      include: [
        {
          model: OrderProductSnapshot,
          paranoid: false,
        },
      ],
    });

    if (
      order?.productSnapshot?.sellerId !== userId &&
      order?.buyerId !== userId
    )
      throw new ForbiddenException(ErrorCause.FORBIDDEN);

    return order;
  }

  private async getIdsBySearchByLoginOrOrderId(query?: string) {
    const orderLikeTransactions = await this.orderRepository.findAll({
      where: {
        id: { [Op.iLike]: `%${query}%` },
      },
    });

    const sellerLikeTransactions = await this.orderRepository.findAll({
      include: [
        {
          model: OrderProductSnapshot,
          paranoid: false,
          required: true,
          include: [
            {
              model: User,
              required: true,
              where: { login: { [Op.iLike]: `%${query}%` } },
            },
          ],
        },
      ],
    });

    const buyerLikeTransactions = await this.orderRepository.findAll({
      include: [
        {
          model: User,
          required: true,
          where: { login: { [Op.iLike]: `%${query}%` } },
        },
      ],
    });

    return [
      ...orderLikeTransactions.map((el) => el.id as string),
      ...buyerLikeTransactions.map((el) => el.id as string),
      ...sellerLikeTransactions.map((el) => el.id as string),
    ];
  }

  async generateOrderId(): Promise<string> {
    let orderId: string;
    do {
      const result = await this.connection.query(
        "SELECT generate_unique_id_for_table('orders') as order_id",
        { type: QueryTypes.SELECT },
      );
      orderId = (result[0] as any).order_id;
    } while (await this.cacheManager.get(`reserved_order_id:${orderId}`));

    await this.cacheManager.set(`reserved_order_id:${orderId}`, true, 610);

    return orderId;
  }

  async checkOrderIdInCache(orderId: string) {
    const exists = await this.cacheManager.get(`reserved_order_id:${orderId}`);
    if (exists !== null && exists !== undefined) {
      return true;
    }

    return false;
  }

  async deleteOrderIdInCache(orderId: string) {
    await this.cacheManager.del(`reserved_order_id:${orderId}`);
  }

  async findAllWithPaginationAndOptions(options: {
    userId: number;
    pageInfo: PageInfoDto;
    onlySales?: boolean;
    gameId?: number;
    gameCategoryId?: number;
    orderStatus?: OrderStatus;
    paymentMethod?: string;
    searchByLoginOrOrderId?: string;
    order?: string;
  }) {
    const { page = 1, limit = 20 } = options.pageInfo;
    const offset = (page - 1) * limit;

    const where: WhereOptions<Order> = { buyerId: options.userId };
    if (options.onlySales) delete where.buyerId;
    if (options.orderStatus) where.status = options.orderStatus;
    if (options.paymentMethod) where.paymentMethod = options.paymentMethod;
    if (options.searchByLoginOrOrderId) {
      where.id = {
        [Op.in]: await this.getIdsBySearchByLoginOrOrderId(
          options.searchByLoginOrOrderId,
        ),
      };
    }

    const include: IncludeOptions[] = [];
    if (options.onlySales || options.gameId || options.gameCategoryId) {
      const productWhere: WhereOptions<Product> = {};
      if (options.onlySales) productWhere.sellerId = options.userId;

      const productInclude: IncludeOptions[] = [];

      if (options.gameId || options.gameCategoryId) {
        const gameCategoryWhere: WhereOptions<GameCategory> = {};
        if (options.gameCategoryId)
          gameCategoryWhere.id = options.gameCategoryId;
        if (options.gameId) gameCategoryWhere.gameId = options.gameId;

        productInclude.push({
          model: GameCategory,
          required: true,
          where: gameCategoryWhere,
        });
      }

      include.push({
        model: OrderProductSnapshot,
        required: true,
        include: [
          {
            model: Product,
            paranoid: false,
            required: true,
            where: productWhere,
            include: productInclude,
          },
        ],
      });
    }

    const { rows, count } = await this.orderRepository.findAndCountAll({
      limit,
      offset,
      distinct: true,
      where,
      include,
      order: options.order
        ? [parseOrderBy(options.order)]
        : [['createdAt', 'DESC']],
    });

    const query = await this.orderRepository.findAll({
      attributes: [
        [
          Sequelize.fn('DISTINCT', Sequelize.col('paymentMethod')),
          'paymentMethod',
        ],
      ],
      raw: true,
      where: !options.onlySales ? { buyerId: options.userId } : {},
      include: options.onlySales
        ? [
            {
              model: OrderProductSnapshot,
              required: true,
              include: [
                {
                  model: Product,
                  paranoid: false,
                  required: true,
                  where: { sellerId: options.userId },
                },
              ],
            },
          ]
        : undefined,
    });

    return {
      rows,
      count,
      paymentMethods: query.map((o) => o.paymentMethod),
      games: await this.gamesService.getGamesWithOrders(
        options.userId,
        options.onlySales,
      ),
      pages: Math.ceil(count / limit),
    };
  }

  async countSuccessOrdersBySellerId(sellerId: number) {
    return await this.orderRepository.count({
      distinct: true,
      where: { status: OrderStatus.COMPLETED },
      include: [
        {
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              required: true,
              paranoid: false,
              include: [
                {
                  model: User,
                  required: true,
                  where: { id: sellerId },
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async countSuccessOrdersByBuyerId(buyerId: number) {
    return await this.orderRepository.count({
      distinct: true,
      where: { status: OrderStatus.COMPLETED, buyerId },
    });
  }
  async countSuccessOrdersForLast14DaysByBuyerId(buyerId: number) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return await this.orderRepository.count({
      distinct: true,
      where: {
        status: OrderStatus.COMPLETED,
        buyerId,
        updatedAt: { [Op.between]: [fourteenDaysAgo, new Date()] },
      },
    });
  }

  async averageSumOfPurchasesByBuyerId(
    buyerId: number,
    targetCurrency: Currency = Currency.RUB,
  ) {
    const query = `
    WITH currency_rates AS (
      SELECT currency::text, value 
      FROM currency_values 
      WHERE currency::text IN (:currencies)
    ),
    converted_orders AS (
      SELECT 
        o.id,
        o.price as original_price,
        o.currency::text as original_currency,
        cr_from.value as from_rate,
        cr_to.value as to_rate,
        CASE 
          WHEN o.currency::text = :targetCurrency THEN o.price
          WHEN cr_from.value IS NULL OR cr_to.value IS NULL THEN NULL
          ELSE ROUND((o.price * cr_from.value / cr_to.value), 4)
        END as converted_price
      FROM orders o
      LEFT JOIN currency_rates cr_from ON o.currency::text = cr_from.currency
      LEFT JOIN currency_rates cr_to ON cr_to.currency = :targetCurrency
      WHERE o.status = :status
        AND o."buyerId" = :buyerId
    )
    SELECT 
      AVG(converted_price) as "averagePrice",
      COUNT(*) as "totalOrders",
      SUM(converted_price) as "totalSum",
      :targetCurrency as currency
    FROM converted_orders
    WHERE converted_price IS NOT NULL
  `;

    const currencies = [targetCurrency, ...Object.values(Currency)];

    const [result] = (await this.connection.query(query, {
      replacements: {
        targetCurrency,
        buyerId,
        status: OrderStatus.COMPLETED,
        currencies: currencies.map((c) => String(c)),
      },
      type: QueryTypes.SELECT,
    })) as [any];

    if (!result) return 0;
    return parseFloat(result.averagePrice) || 0;
  }
  async averageSumOfPurchasesForLast14DaysByBuyerId(
    buyerId: number,
    targetCurrency: Currency = Currency.RUB,
  ) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const startDate = fourteenDaysAgo.toISOString();
    const endDate = new Date().toISOString();

    const query = `
    WITH currency_rates AS (
      SELECT currency::text, value 
      FROM currency_values 
      WHERE currency::text IN (:currencies)
    ),
    converted_orders AS (
      SELECT 
        o.id,
        o.price as original_price,
        o.currency::text as original_currency,
        cr_from.value as from_rate,
        cr_to.value as to_rate,
        CASE 
          WHEN o.currency::text = :targetCurrency THEN o.price
          WHEN cr_from.value IS NULL OR cr_to.value IS NULL THEN NULL
          ELSE ROUND((o.price * cr_from.value / cr_to.value), 4)
        END as converted_price
      FROM orders o
      LEFT JOIN currency_rates cr_from ON o.currency::text = cr_from.currency
      LEFT JOIN currency_rates cr_to ON cr_to.currency = :targetCurrency
      WHERE o.status = :status
        AND o."buyerId" = :buyerId
        AND o."updatedAt" BETWEEN :startDate AND :endDate
    )
    SELECT 
      AVG(converted_price) as "averagePrice",
      COUNT(*) as "totalOrders",
      SUM(converted_price) as "totalSpent",
      :targetCurrency as currency
    FROM converted_orders
    WHERE converted_price IS NOT NULL
  `;

    const currencies = [targetCurrency, ...Object.values(Currency)];

    const [result] = (await this.connection.query(query, {
      replacements: {
        targetCurrency,
        buyerId,
        status: OrderStatus.COMPLETED,
        startDate,
        endDate,
        currencies: currencies.map((c) => String(c)),
      },
      type: QueryTypes.SELECT,
    })) as [any];

    if (!result) return 0;
    return parseFloat(result.averagePrice) || 0;
  }

  async averageSumOfSalesBySellerId(
    sellerId: number,
    targetCurrency: Currency = Currency.RUB,
  ) {
    const query = `
    WITH currency_rates AS (
      SELECT currency::text, value 
      FROM currency_values 
      WHERE currency::text IN (:currencies)
    ),
    converted_orders AS (
      SELECT 
        o.id,
        o.price as original_price,
        o.currency::text as original_currency,
        cr_from.value as from_rate,
        cr_to.value as to_rate,
        CASE 
          WHEN o.currency::text = :targetCurrency THEN o.price
          WHEN cr_from.value IS NULL OR cr_to.value IS NULL THEN NULL
          ELSE ROUND((o.price * cr_from.value / cr_to.value), 4)
        END as converted_price
      FROM orders o
      INNER JOIN order_product_snapshots ops ON o."productSnapshotId" = ops."orderId"
      INNER JOIN products p ON ops."originalProductId" = p.id AND p."sellerId" = :sellerId
      LEFT JOIN currency_rates cr_from ON o.currency::text = cr_from.currency
      LEFT JOIN currency_rates cr_to ON cr_to.currency = :targetCurrency
      WHERE o.status = :status
    )
    SELECT 
      AVG(converted_price) as "averagePrice",
      COUNT(*) as "totalOrders",
      SUM(converted_price) as "totalSum",
      :targetCurrency as currency
    FROM converted_orders
    WHERE converted_price IS NOT NULL
  `;

    const currencies = [targetCurrency, ...Object.values(Currency)];

    const [result] = (await this.connection.query(query, {
      replacements: {
        targetCurrency,
        sellerId,
        status: OrderStatus.COMPLETED,
        currencies: currencies.map((c) => String(c)),
      },
      type: QueryTypes.SELECT,
    })) as [any];

    if (!result) return 0;
    return parseFloat(result.averagePrice) || 0;
  }

  async averageSumOfSalesForLast14DaysBySellerId(
    sellerId: number,
    targetCurrency: Currency = Currency.RUB,
  ) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Форматируем даты для PostgreSQL
    const startDate = fourteenDaysAgo.toISOString();
    const endDate = new Date().toISOString();

    const query = `
    WITH currency_rates AS (
      SELECT currency::text, value 
      FROM currency_values 
      WHERE currency::text IN (:currencies)
    ),
    converted_orders AS (
      SELECT 
        o.id,
        o.price as original_price,
        o.currency::text as original_currency,
        cr_from.value as from_rate,
        cr_to.value as to_rate,
        CASE 
          WHEN o.currency::text = :targetCurrency THEN o.price
          WHEN cr_from.value IS NULL OR cr_to.value IS NULL THEN NULL
          ELSE ROUND((o.price * cr_from.value / cr_to.value), 4)
        END as converted_price
      FROM orders o
      INNER JOIN order_product_snapshots ops ON o."productSnapshotId" = ops."orderId"
      INNER JOIN products p ON ops."originalProductId" = p.id AND p."sellerId" = :sellerId
      LEFT JOIN currency_rates cr_from ON o.currency::text = cr_from.currency
      LEFT JOIN currency_rates cr_to ON cr_to.currency = :targetCurrency
      WHERE o.status = :status
        AND o."updatedAt" BETWEEN :startDate AND :endDate
    )
    SELECT 
      AVG(converted_price) as "averagePrice",
      COUNT(*) as "totalOrders",
      SUM(converted_price) as "totalSum",
      :targetCurrency as currency
    FROM converted_orders
    WHERE converted_price IS NOT NULL
  `;

    const currencies = [targetCurrency, ...Object.values(Currency)];

    const [result] = (await this.connection.query(query, {
      replacements: {
        targetCurrency,
        sellerId,
        status: OrderStatus.COMPLETED,
        startDate,
        endDate,
        currencies: currencies.map((c) => String(c)),
      },
      type: QueryTypes.SELECT,
    })) as [any];

    if (!result) return 0;
    return parseFloat(result.averagePrice) || 0;
  }
  async countSuccessOrdersForLast14DaysBySellerId(sellerId: number) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    return await this.orderRepository.count({
      distinct: true,
      where: {
        status: OrderStatus.COMPLETED,
        updatedAt: {
          [Op.between]: [fourteenDaysAgo, new Date()],
        },
      },
      include: [
        {
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              required: true,
              paranoid: false,
              include: [
                {
                  model: User,
                  required: true,
                  where: { id: sellerId },
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async countOrdersBySellerId(sellerId: number) {
    return await this.orderRepository.count({
      distinct: true,
      include: [
        {
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              paranoid: false,
              required: true,
              include: [
                {
                  model: User,
                  required: true,
                  where: { id: sellerId },
                },
              ],
            },
          ],
        },
      ],
    });
  }
  async countOrdersByBuyerId(buyerId: number) {
    return await this.orderRepository.count({
      distinct: true,
      where: { buyerId },
    });
  }
  async countCompletedOrdersByBuyerId(buyerId: number) {
    return await this.orderRepository.count({
      distinct: true,
      where: { buyerId, status: OrderStatus.COMPLETED },
    });
  }
  async countOrdersForLast14DaysByBuyerId(buyerId: number) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return await this.orderRepository.count({
      distinct: true,
      where: {
        buyerId,
        updatedAt: {
          [Op.between]: [fourteenDaysAgo, new Date()],
        },
      },
    });
  }
  async countCompletedOrdersForLast14DaysByBuyerId(buyerId: number) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return await this.orderRepository.count({
      distinct: true,
      where: {
        buyerId,
        status: OrderStatus.COMPLETED,
        updatedAt: {
          [Op.between]: [fourteenDaysAgo, new Date()],
        },
      },
    });
  }

  async countOrdersForLast14DaysBySellerId(sellerId: number) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return await this.orderRepository.count({
      distinct: true,
      where: { updatedAt: { [Op.between]: [fourteenDaysAgo, new Date()] } },
      include: [
        {
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              required: true,
              paranoid: false,
              include: [
                {
                  model: User,
                  required: true,
                  where: { id: sellerId },
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async sumOfSuccessOrdersBySellerId(
    sellerId: number,
    currency: Currency = Currency.RUB,
  ) {
    const result = (await this.orderRepository.findOne({
      attributes: [
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(`"Order"."price" * "currencyValue"."value"`),
          ),
          'total',
        ],
      ],
      where: {
        status: OrderStatus.COMPLETED,
      },
      include: [
        {
          model: CurrencyValue,
          attributes: [],
          required: true,
          on: Sequelize.literal(
            `"currencyValue"."currency"::text = "Order"."currency"::text`,
          ),
        },
        {
          model: OrderProductSnapshot,
          attributes: [],
          required: true,
          include: [
            {
              model: Product,
              attributes: [],
              required: true,
              paranoid: false,
              where: {
                sellerId: sellerId,
              },
            },
          ],
        },
      ],
      raw: true,
    })) as any;

    return parseFloat(result?.total as string) || 0;
  }

  async countRefundedOrdersBySellerId(sellerId: number) {
    return await this.orderRepository.count({
      distinct: true,
      where: { status: OrderStatus.REFUNDED },
      include: [
        {
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              required: true,
              paranoid: false,
              include: [
                {
                  model: User,
                  required: true,
                  where: { id: sellerId },
                },
              ],
            },
          ],
        },
      ],
    });
  }
  async countRefundedOrdersForLast14DaysBySellerId(sellerId: number) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return await this.orderRepository.count({
      distinct: true,
      where: {
        status: OrderStatus.REFUNDED,
        updatedAt: { [Op.between]: [fourteenDaysAgo, new Date()] },
      },
      include: [
        {
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              required: true,
              paranoid: false,
              include: [
                {
                  model: User,
                  required: true,
                  where: { id: sellerId },
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async makeOrderIsCompletedAndSendMoneyToSeller(
    orderId: string,
    buyerId: number,
  ) {
    return await this.connection.transaction(async (transaction) => {
      const order = await this.orderRepository.findByPk(orderId, {
        transaction,
        include: [
          { model: OrderProductSnapshot, paranoid: false, include: [User] },
          User,
        ],
      });

      if (order?.buyerId !== buyerId)
        throw new ForbiddenException(ErrorCause.FORBIDDEN);

      if (order?.status !== OrderStatus.PENDING)
        throw new ForbiddenException(ErrorCause.FORBIDDEN);

      await order.update({ status: OrderStatus.COMPLETED }, { transaction });

      const convetedAmount = await this.currenciesService.convert(
        order.priceWithoutCommission,
        order.currencyForPriceWithoutCommission,
        order.productSnapshot.seller.selectedCurrency,
        transaction,
      );

      const sellerFinance = await this.financeService.findOrCreate(
        {
          userId: order.productSnapshot.sellerId,
        },
        transaction,
      );

      await this.transactionsService.create(
        {
          amount: convetedAmount,
          currency: order.productSnapshot.seller.selectedCurrency,
          financeId: sellerFinance?.id,
          type: TransactionType.REPLENISHMENT,
          orderId: order.id,
        },
        transaction,
      );

      const chat = await this.chatsService.createChat(
        buyerId,
        { member: order.productSnapshot.sellerId },
        transaction,
      );

      await this.messagesService.createSystemMessage(
        buyerId,
        chat?.id,
        MessageType.ORDER_CONFIRMED_BUYER,
        {
          buyerId,
          orderId: order.id,
          sellerId: order.productSnapshot.sellerId,
        },
        { transaction },
      );

      return await order.reload();
    });
  }

  async createOrderEndpoint(
    dto: CreateOrderDto,
    user: User,
    currency: Currency,
    locale: Locale,
    userPayedAmount?: number,
    transaction?: Transaction,
    fromBalance?: Boolean,
  ) {
    return await this.connection.transaction(
      { transaction },
      async (transaction) => {
        const product = await this.productService.findById(dto.productId, {
          transaction,
        });

        const sellerBlacklist = await this.usersService.checkUserInBlacklist(
          { ownerId: product!.sellerId, bannedUserId: user.id },
          {
            transaction,
          },
        );

        if (sellerBlacklist)
          throw new ForbiddenException(ErrorCause.SELLER_BLACKLISTED_YOU);

        if (product?.sellerId === user.id) {
          throw new ForbiddenException(
            ErrorCause.YOU_CANT_BUY_YOUR_OWN_PRODUCT,
          );
        }

        let productLot: ProductLot | null = null;

        if (product?.autoDelivery) {
          try {
            productLot = await this.productService.getAvailableLot(
              dto.productId,
              transaction,
            );
          } catch (e) {
            if (e instanceof NotFoundException)
              throw new BadRequestException(ErrorCause.LOTS_ARE_OVER);
            throw e;
          }
        }

        const finance = await this.financeService.findOrCreate(
          { userId: user.id },
          transaction,
        );

        let discount = 0;

        if (fromBalance) {
          const gameCategory = await this.gameCategoryService.findById(
            Number(product!.gameCategoryId),
            transaction,
          );
          const productPrice = await this.currenciesService.convert(
            product!.price,
            product!.currency,
            Currency.RUB,
            transaction,
          );
          const d =
            (Number(productPrice) *
              Number(gameCategory!.discountForBalancePayment)) /
            100;

          const result = Math.min(finance?.hiddenBalanceInRub || 0, d);

          discount = await this.currenciesService.convert(
            result,
            Currency.RUB,
            currency,
            transaction,
          );
        }

        const convertedPrice = await this.currenciesService.convert(
          product!.price - discount,
          product!.currency,
          currency,
          transaction,
        );

        const orderPrice = userPayedAmount
          ? userPayedAmount > convertedPrice
            ? userPayedAmount
            : convertedPrice
          : convertedPrice;

        if (product?.quantity && product.quantity > 0) {
          if (product.quantity === 1 && product.deactiveAfterSell) {
            await product.update({ active: false }, { transaction });
          }
          product.quantity -= 1;
          await product.save({ transaction });
        }

        const order = await this.createOrder(
          {
            ...dto,
            paymentMethod: dto.paymentMethod || 'Баланс BetaGames',
            currency,
            price: orderPrice,
            productLotId: productLot?.id,
            buyerId: user.id,
            priceWithoutCommission: product!.price - discount,
            currencyForPriceWithoutCommission: product!.currency,
          },
          transaction,
        );

        try {
          await this.transactionsService.create(
            {
              financeId: finance!.id,
              amount: -(convertedPrice - discount),
              currency,
              type: TransactionType.DEDUCTION,
              orderId: order.id,
            },
            transaction,
          );
          await this.transactionsService.create(
            {
              financeId: finance!.id,
              amount: -discount,
              currency: Currency.RUB,
              type: TransactionType.DEDUCTION,
              orderId: order.id,
              isHiddenBalanceInRub: true,
            },
            transaction,
          );
        } catch (e) {
          if (e instanceof BadRequestException) {
            if (e.message === ErrorCause.NOT_ENOUGH_MONEY)
              await transaction.rollback();
          }

          throw e;
        }

        const chat = await this.chatsService.createChat(
          user.id,
          { member: product!.sellerId },
          transaction,
        );

        await this.messagesService.createSystemMessage(
          user.id,
          chat!.id,
          MessageType.ORDER_PAID,
          { orderId: order.id, buyerId: user.id, productId: product!.id },
          { transaction },
        );

        if (product?.translations?.[0]?.messageForBuyer) {
          const msg = product.translations.find(
            (translation) => translation.locale === locale,
          );
          await this.messagesService.createSystemMessage(
            product?.sellerId,
            chat!.id,
            MessageType.AUTOREPLY,
            { text: msg?.messageForBuyer },
            { transaction },
          );
        }

        if (product?.autoDelivery && productLot) {
          await this.messagesService.createSystemMessage(
            product?.sellerId,
            chat!.id,
            MessageType.AUTOREPLY,
            { text: productLot.text },
            { transaction },
          );
        }

        return order;
      },
    );
  }

  async getRankByBuyerId(buyerId: number) {
    const result = (await Order.findAll({
      attributes: [
        'buyerId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'orderCount'], // Количество заказов
        [
          Sequelize.literal(`RANK() OVER (ORDER BY COUNT(id) DESC)`), // Сортируем по COUNT(id)
          'position',
        ],
      ],
      where: {
        status: OrderStatus.COMPLETED,
      },
      group: ['buyerId'],
      having: Sequelize.where(
        Sequelize.fn('COUNT', Sequelize.col('id')),
        '>',
        0,
      ),
      raw: true,
    })) as any[] as { buyerId: number; position: string; orderCount: string }[];

    const buyerResult = result.find((item) => item.buyerId === buyerId);

    if (!buyerResult?.position) return null;

    return Number(buyerResult?.position) || null;
  }

  async getOrderById(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      // @ts-ignore
      hooks: false,
      include: [{ model: OrderProductSnapshot, required: true }],
    });
    if (!order) throw new NotFoundException(ErrorCause.ORDER_NOT_FOUND);
    return order;
  }

  async makeOrderIsProblematic(orderId: string) {
    const order = await this.getOrderById(orderId);
    await order?.update({ isProblematic: true });
    return await order?.reload();
  }
  async refundOrder(orderId: string, userId: number) {
    return await this.connection.transaction(async (transaction) => {
      const order = await this.orderRepository.findByPk(orderId, {
        include: [
          {
            model: OrderProductSnapshot,
            required: true,
            include: [
              {
                model: Product,
                required: true,
                paranoid: false,
                include: [
                  {
                    model: User,
                    required: true,
                  },
                ],
              },
            ],
          },
          {
            model: User,
            required: true,
          },
        ],
        transaction,
      });

      if (order?.status !== OrderStatus.PENDING)
        throw new ForbiddenException(ErrorCause.FORBIDDEN);

      if (order?.productSnapshot.sellerId !== userId)
        throw new NotFoundException(ErrorCause.ORDER_NOT_FOUND);

      const amount = Number(order.price);
      const convertedToBuyerAmount = await this.currenciesService.convert(
        amount,
        order.currency,
        order.buyer.selectedCurrency,
        transaction,
      );

      const buyerFinance = await this.financeService.findOrCreate(
        {
          userId: order.buyerId,
        },
        transaction,
      );

      await this.transactionsService.create(
        {
          amount: convertedToBuyerAmount,
          currency: order.buyer.selectedCurrency,
          financeId: buyerFinance?.id,
          type: TransactionType.REFUND,
          orderId: order.id,
        },
        transaction,
      );

      const chat = await this.chatsService.createChat(
        order.buyerId,
        { member: order.productSnapshot.sellerId },
        transaction,
      );

      await this.messagesService.createSystemMessage(
        order.productSnapshot.sellerId,
        chat?.id,
        MessageType.REFUND_CHECK,
        {
          orderId: order.id,
        },
        { transaction },
      );

      await order.update({ status: OrderStatus.REFUNDED }, { transaction });

      return await order.reload({ transaction });
    });
  }

  async countReopenedOrdersBySellerId(sellerId: number) {
    return await this.orderRepository.count({
      distinct: true,
      where: {
        [Op.or]: {
          status: OrderStatus.REOPENED,
          isAlreadyReopened: true,
          waitToReopen: true,
        },
      },
      include: [
        {
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              required: true,
              paranoid: false,
              include: [
                {
                  model: User,
                  required: true,
                  where: { id: sellerId },
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async reopenWaitingToReopenOrders(userId: number) {
    const waitingToReopenOrders =
      await this.getWaitingToReopenOrdersBySellerId(userId);

    if (waitingToReopenOrders.length > 0) {
      for await (const order of waitingToReopenOrders) {
        try {
          await this.reopenOrder(order.id, order.buyerId);
        } catch {}
      }
    }
  }

  async getWaitingToReopenOrdersBySellerId(sellerId: number) {
    return await this.orderRepository.findAll({
      where: {
        waitToReopen: true,
      },
      order: [['updatedAt', 'ASC']],
      include: [
        {
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              required: true,
              paranoid: false,
              include: [
                {
                  model: User,
                  required: true,
                  where: { id: sellerId },
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async reopenOrder(orderId: string, userId: number) {
    return await this.connection.transaction(async (transaction) => {
      const order = await this.orderRepository.findByPk(orderId, {
        include: [
          {
            model: OrderProductSnapshot,
            required: true,
            include: [
              {
                model: Product,
                required: true,
                paranoid: false,
                include: [
                  {
                    model: User,
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
        transaction,
      });
    });
  }

  async makeOrderIsPriority(orderId: string) {
    const order = await this.getOrderById(orderId);
    await order?.update({ isPriority: true });
    return await order?.reload();
  }

  async createOrderProductSnapshots(params: {
    orderId: string;
    productId: number;
    transaction: Transaction;
  }) {
    const { orderId, productId, transaction } = params;

    const product = await this.productService.findById(productId, {
      include: [ProductOption, ProductTranslation, ProductFile],
      transaction,
    });

    if (!product) throw new NotFoundException(ErrorCause.PRODUCT_NOT_FOUND);

    const orderProductSnapshot =
      await this.orderProductSnapshotRepository.create(
        {
          orderId,
          originalProductId: product.id,
          gameCategoryId: product.gameCategoryId,
          sellerId: product.sellerId,
          slug: product.slug,
          price: product.price,
          currency: product.currency,
          autoDelivery: product.autoDelivery,
          active: product.active,
          deactiveAfterSell: product.deactiveAfterSell,
          quantity: product.quantity,
          lastLiftingAt: product.lastLiftingAt,
        },
        { transaction },
      );

    if (product.options?.length) {
      await this.orderProductOptionSnapshotRepository.bulkCreate(
        product.options.map((opt) => ({
          orderProductSnapshotId: orderProductSnapshot.orderId,
          gameCategoryOptionId: opt.gameCategoryOptionId,
          value: opt.value,
        })),
        { transaction },
      );
    }

    if (product.translations?.length) {
      await this.orderProductTranslationSnapshotRepository.bulkCreate(
        product.translations.map((tr) => ({
          orderProductSnapshotId: orderProductSnapshot.orderId,
          locale: tr.locale,
          name: tr.name,
          description: tr.description,
          messageForBuyer: tr.messageForBuyer,
        })),
        { transaction },
      );
    }

    if (product.filesKeys?.length) {
      await this.orderProductFileSnapshotRepository.bulkCreate(
        product.filesKeys.map((file) => ({
          orderProductSnapshotId: orderProductSnapshot.orderId,
          fileKey: file.fileKey,
        })),
        { transaction },
      );
    }

    return orderProductSnapshot;
  }

  async createOrder(
    creationAttrs: Omit<
      Omit<OrderCreationAttrs, 'status'>,
      'productSnapshotId'
    > & { productId: number },
    transaction?: Transaction,
  ) {
    return await this.connection.transaction(
      { transaction },
      async (transaction) => {
        let orderId: string;

        if (creationAttrs.id) {
          orderId = creationAttrs.id;
        } else {
          orderId = await this.generateOrderId();
        }

        const productSnapshot = await this.createOrderProductSnapshots({
          productId: creationAttrs.productId,
          orderId,
          transaction,
        });

        if (!productSnapshot) throw new InternalServerErrorException();

        const order = await this.orderRepository.create(
          {
            ...creationAttrs,
            id: orderId,
            productSnapshotId: productSnapshot.orderId,
            status: OrderStatus.PENDING,
          },
          { transaction },
        );

        await this.deleteOrderIdInCache(orderId);

        return order;
      },
    );
  }
}
