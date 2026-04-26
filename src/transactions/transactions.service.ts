import { YooCheckout } from '@a2seven/yoo-checkout';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import axios from 'axios';
import { randomUUID } from 'crypto';
import {
  IncludeOptions,
  Op,
  Sequelize,
  Transaction as TransactionSequelize,
  WhereOptions,
} from 'sequelize';
import { CommissionsService } from 'src/commissions/commissions.service';
import { ErrorCause } from 'src/errors-couse';
import { FinanceService } from 'src/finance/finance.service';
import { GameCategory } from 'src/game-categories/models/game-categories.model';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { parseOrderBy } from 'src/global/utils/parseOrderBy';
import {
  Currency,
  OrderStatus,
  TransactionType,
  WithdrawalRublesMethods,
} from 'src/graphql';
import { OrderProductSnapshot } from 'src/orders/models/order-product-snapshot.model';
import { Order } from 'src/orders/models/orders.model';
import { OrdersService } from 'src/orders/orders.service';
import { Product } from 'src/products/models/products.model';
import { ProductService } from 'src/products/products.service';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { BuyProductFromBalanceDto } from './dto/create-transactions.dto';
import { WithdrawalRublesDto } from './dto/withdrawal-rubles.dto';
import {
  Transaction,
  TransactionCreationAttrs,
} from './model/transactions.model';
import { YooKassaPayoutDestinationData } from './yookassa.interface';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectConnection() private readonly connection: Sequelize,
    @InjectModel(Transaction)
    private readonly transactionsRepository: typeof Transaction,
    private readonly financeService: FinanceService,
    private readonly configService: ConfigService,
    private readonly commissionsService: CommissionsService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly productService: ProductService,
  ) {}

  private readonly YOO_KASSA_PAYOUT_URL = 'https://api.yookassa.ru/v3/payouts/';

  private async getIdsBySearchByLoginOrOrderId(query?: string) {
    const orderLikeTransactions = await this.transactionsRepository.findAll({
      where: {
        orderId: { [Op.iLike]: `%${query}%` },
      },
    });

    const sellerLikeTransactions = await this.transactionsRepository.findAll({
      include: [
        {
          model: Order,
          required: true,
          include: [
            {
              model: OrderProductSnapshot,
              required: true,
              paranoid: false,
              include: [
                {
                  model: User,
                  required: true,
                  where: { login: { [Op.iLike]: `%${query}%` } },
                },
              ],
            },
          ],
        },
      ],
    });

    const buyerLikeTransactions = await this.transactionsRepository.findAll({
      include: [
        {
          model: Order,
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

    return [
      ...orderLikeTransactions.map((el) => el.id as number),
      ...buyerLikeTransactions.map((el) => el.id as number),
      ...sellerLikeTransactions.map((el) => el.id as number),
    ];
  }

  async findByUserId(
    userId: number,
    options: {
      pageInfo: PageInfoDto;
      order?: string;
      onlyPurchases?: boolean;
      onlySales?: boolean;
      orderStatus?: OrderStatus;
      gameId?: number;
      searchByLoginOrOrderId?: string;
      type?: TransactionType;
      paymentMethod?: string;
      gameCategoryId?: number;
    },
  ) {
    const { page = 1, limit = 20 } = options.pageInfo;

    const offset = (page - 1) * limit;

    const finance = await this.financeService.findOrCreate({ userId });

    const where: WhereOptions<Transaction> = { financeId: finance?.id };

    if (options.searchByLoginOrOrderId) {
      where.id = {
        [Op.in]: await this.getIdsBySearchByLoginOrOrderId(
          options.searchByLoginOrOrderId,
        ),
      };
    }

    if (options.type) where.type = options.type;
    if (options.onlyPurchases) where.type = TransactionType.DEDUCTION;
    if (options.onlySales) where.type = TransactionType.REPLENISHMENT;

    const include: IncludeOptions[] = [];

    if (
      options.onlyPurchases ||
      options.onlySales ||
      options.orderStatus ||
      options.gameId ||
      options.paymentMethod ||
      options.gameCategoryId
    ) {
      const orderWhere: WhereOptions<Order> = {};
      if (options.orderStatus) orderWhere.status = options.orderStatus;
      if (options.paymentMethod)
        orderWhere.paymentMethod = options.paymentMethod;
      const orderInclude: IncludeOptions[] = [];
      if (options.gameId || options.gameCategoryId) {
        const gameCategoryWhere: WhereOptions<GameCategory> = {};
        if (options.gameId) gameCategoryWhere.gameId = options.gameId;
        if (options.gameCategoryId)
          gameCategoryWhere.id = options.gameCategoryId;

        orderInclude.push({
          model: OrderProductSnapshot,
          required: true,
          include: [
            {
              model: Product,
              paranoid: false,
              required: true,
              include: [
                {
                  model: GameCategory,
                  required: true,
                  where: gameCategoryWhere,
                },
              ],
            },
          ],
        });
      }
      include.push({
        model: Order,
        required: true,
        where: orderWhere,
        include: orderInclude,
      });
    }

    const { rows, count } = await this.transactionsRepository.findAndCountAll({
      limit,
      offset,
      distinct: true,
      where,
      include,
      order: options.order
        ? [parseOrderBy(options.order)]
        : [['createdAt', 'DESC']],
    });

    return {
      rows,
      count,
      paymentMethods: await this.getPaymentMethodsByUserId(userId),
      pages: Math.ceil(count / limit),
    };
  }

  async getPaymentMethodsByUserId(userId: number) {
    const finance = await this.financeService.findOrCreate({ userId });

    const transactions = await this.transactionsRepository.findAll({
      where: { financeId: finance?.id },
      include: [
        {
          model: Order,
          required: true,
        },
      ],
    });

    const result: string[] = [];

    for await (const t of transactions) {
      if (result.includes(t.order?.paymentMethod!)) continue;
      result.push(t.order?.paymentMethod!);
    }

    return result;
  }

  async create(
    creationAttrs: TransactionCreationAttrs & {
      isHiddenBalanceInRub?: boolean;
    },
    transaction?: TransactionSequelize,
  ) {
    return await this.connection.transaction(
      { transaction },
      async (transaction) => {
        const finance = await this.financeService.findById(
          creationAttrs.financeId,
          transaction,
        );

        if (creationAttrs.isHiddenBalanceInRub && finance) {
          creationAttrs.isHidden = true;
          const hiddenBalanceInRub = Number(finance.hiddenBalanceInRub);
          if (hiddenBalanceInRub + Number(creationAttrs.amount) < 0) {
            throw new BadRequestException(ErrorCause.NOT_ENOUGH_MONEY);
          }
          finance.hiddenBalanceInRub =
            hiddenBalanceInRub + Number(creationAttrs.amount);
        } else if (finance) {
          switch (creationAttrs.currency) {
            case Currency.RUB:
              const rub = Number(finance.rub);
              if (rub + Number(creationAttrs.amount) < 0) {
                throw new BadRequestException(ErrorCause.NOT_ENOUGH_MONEY);
              }
              finance.rub = rub + Number(creationAttrs.amount);
              break;
            case Currency.EUR:
              const eur = Number(finance.eur);
              if (eur + Number(creationAttrs.amount) < 0) {
                throw new BadRequestException(ErrorCause.NOT_ENOUGH_MONEY);
              }
              finance.eur = eur + Number(creationAttrs.amount);
              break;
            case Currency.USD:
              const usd = Number(finance.usd);
              if (usd + Number(creationAttrs.amount) < 0) {
                throw new BadRequestException(ErrorCause.NOT_ENOUGH_MONEY);
              }
              finance.usd = usd + Number(creationAttrs.amount);
              break;
          }

          await this.ordersService.reopenWaitingToReopenOrders(finance.userId);
        }

        await finance?.save({ transaction });

        return await this.transactionsRepository.create(creationAttrs, {
          transaction,
        });
      },
    );
  }

  async addMoney(userId: number, amount: number, currency: Currency) {
    const finance = await this.financeService.findOrCreate({ userId });

    return await this.create({
      financeId: finance?.id,
      amount,
      currency,
      type:
        amount > 0 ? TransactionType.REPLENISHMENT : TransactionType.WITHDRAWAL,
    });
  }

  async withdrawalRubles(dto: WithdrawalRublesDto, userId: number) {
    const countReopenedOrders =
      await this.ordersService.countReopenedOrdersBySellerId(userId);

    if (countReopenedOrders > 0)
      throw new ForbiddenException(ErrorCause.YOU_HAVE_ANY_REOPENED_ORDERS);

    return await this.connection.transaction(async (transaction) => {
      const payoutDestinationData: YooKassaPayoutDestinationData = {
        type: dto.type,
      };
      if (dto.type === WithdrawalRublesMethods.bank_card) {
        payoutDestinationData.card = { number: dto.cardNumber };
      }
      if (dto.type === WithdrawalRublesMethods.sbp) {
        payoutDestinationData.bank_id = dto.bankId;
        payoutDestinationData.phone = dto.phone;
      }
      if (dto.type === WithdrawalRublesMethods.yoo_money) {
        payoutDestinationData.account_number = dto.accountNumber;
      }

      let payoutResponse: any;
      try {
        const dataAndConfig = this.configureYooKassaPayoutData(
          dto.amount.toFixed(2),
          payoutDestinationData,
        );

        payoutResponse = await axios.post(
          this.YOO_KASSA_PAYOUT_URL,
          dataAndConfig.data,
          dataAndConfig.config,
        );
      } catch (e) {
        throw new BadRequestException(ErrorCause.BAD_REQUEST_FROM_YOOKASSA);
      }
    });
  }

  async getReplenishAccountYooKassaUrl(
    amount: number,
    userId: number,
    buyProductId?: number,
  ) {
    const cost = await this.commissionsService.calculateCostByCommission(
      amount,
      'yu-money',
      Currency.RUB,
    );

    if (buyProductId) {
      const product = await this.productService.findById(buyProductId);

      const sellerBlacklist = await this.usersService.checkUserInBlacklist({
        ownerId: product!.sellerId,
        bannedUserId: userId,
      });

      if (sellerBlacklist)
        throw new ForbiddenException(ErrorCause.SELLER_BLACKLISTED_YOU);
    }

    const finance = await this.financeService.findOrCreate({ userId });

    const orderId = await this.ordersService.generateOrderId();

    const checkout = new YooCheckout({
      shopId: this.configService.get<string>('YOOKASSA_SHOP_ID') || '',
      secretKey: this.configService.get<string>('YOOKASSA_SECRET_KEY') || '',
    });

    try {
      const payment = await checkout.createPayment({
        amount: {
          value: `${cost}`,
          currency: 'RUB',
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: buyProductId
            ? `${this.configService.get<string>('YOOKASSA_RETURN_URL_IF_BUY_PRODUCT')}${orderId}`
            : this.configService.get<string>('YOOKASSA_RETURN_URL') || '',
        },
        metadata: {
          financeId: finance!.id,
          enteredAmount: amount,
          userPayedAmount: cost,
          userId,
          buyProductId,
          reservedOrderId: orderId,
        },
      });
      return payment.confirmation.confirmation_url;
    } catch (e) {
      console.log(e);
    }
  }

  async buyProductFromBalance(dto: BuyProductFromBalanceDto, user: User) {
    return await this.ordersService.createOrderEndpoint(
      {
        paymentMethod: 'Баланс BetaGames',
        productId: dto.productId,
      },
      user,
      user.selectedCurrency,
      user.selectedLocale,
    );
  }

  private configureYooKassaPayoutData(
    amount: string,
    payout_destination_data: YooKassaPayoutDestinationData,
  ) {
    return {
      data: {
        amount: {
          value: amount,
          currency: Currency.RUB,
        },
        payout_destination_data,
      },
      config: {
        auth: {
          username: this.configService.get<string>('YOOKASSA_AGENT_ID') || '',
          password:
            this.configService.get<string>('YOOKASSA_SECRET_PAYOUTS_KEY') || '',
        },
        headers: {
          'Idempotence-Key': randomUUID(),
        },
      },
    };
  }
}
