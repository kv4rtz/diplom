import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { type Request } from 'express';
import { Sequelize } from 'sequelize';
import { FinanceService } from 'src/finance/finance.service';
import { Currency, TransactionType } from 'src/graphql';
import { IpService } from 'src/ip/ip.service';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';
import { TransactionsService } from './transactions.service';
import { type YookassaNotification } from './yookassa.interface';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly ipService: IpService,
    private readonly ordersService: OrdersService,
    private readonly financeService: FinanceService,
    private readonly usersService: UsersService,
    @InjectConnection() private readonly connection: Sequelize,
  ) {}

  @Post('yookassa/webhook')
  @HttpCode(200)
  async yookassaWebhook(
    @Body() body: YookassaNotification,
    @Req() req: Request,
  ) {
    const headers = req.headers as { 'x-real-ip'?: string };
    if (!this.ipService.isYookassaIp(headers['x-real-ip'] || '')) {
      throw new ForbiddenException();
    }

    const externalAmountFromYooKassa = Number(
      body.object.income_amount?.value || body.object.amount.value,
    );

    const amount =
      externalAmountFromYooKassa > body.object.metadata.enteredAmount
        ? body.object.metadata.enteredAmount
        : externalAmountFromYooKassa;

    if (body.event === 'payment.succeeded' && body.object.paid) {
      await this.connection.transaction(async (transaction) => {
        await this.transactionsService.create(
          {
            financeId: Number(body.object.metadata.financeId),
            amount,
            currency: body.object.amount.currency as Currency,
            type: TransactionType.REPLENISHMENT,
          },
          transaction,
        );
        const inHiddenBalanceAmount =
          body.object.metadata.userPayedAmount -
          body.object.metadata.enteredAmount;
        await this.transactionsService.create(
          {
            financeId: Number(body.object.metadata.financeId),
            amount: inHiddenBalanceAmount,
            currency: Currency.RUB,
            type: TransactionType.REPLENISHMENT,
            isHiddenBalanceInRub: true,
          },
          transaction,
        );
      });

      try {
        if (body.object.metadata?.buyProductId) {
          await this.connection.transaction(async (transaction) => {
            if (body.object.metadata.buyProductId) {
              const user = await this.usersService.getUserById(
                body.object.metadata.userId,
                { transaction },
              );

              await this.ordersService.createOrderEndpoint(
                {
                  paymentMethod: 'ЮKassa',
                  productId: body.object.metadata.buyProductId,
                  id: body.object.metadata.reservedOrderId,
                },
                user!,
                user!.selectedCurrency,
                user!.selectedLocale,
                body.object.metadata?.userPayedAmount,
                transaction,
              );
            }
          });

          return;
        }
      } catch {}
    }
  }
}
