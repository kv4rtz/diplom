import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import axios from 'axios';
import { Op, Transaction } from 'sequelize';
import { Currency } from 'src/graphql';
import { CbrXmlDailyResponse } from './external-api.types';
import {
  CurrencyValue,
  CurrencyValueCreationAttrs,
} from './models/currency-value.model';

@Injectable()
export class CurrenciesService implements OnModuleInit {
  private readonly logger = new Logger(CurrenciesService.name);

  constructor(
    @InjectModel(CurrencyValue)
    private readonly currencyValueRepository: typeof CurrencyValue,
  ) {}

  async onModuleInit() {
    if (await this.hasToDayCurrencies()) return;

    this.updateCurrenciesEveryDay();

    if (await this.hasCurrencies()) return;

    const values = await this.getLatestCurrenciesFromExternalApi();

    Object.values(Currency).forEach(async (currency) => {
      await this.createCurrencyValue({ currency, value: values[currency] });
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM, { timeZone: 'Europe/Moscow' })
  async updateCurrenciesEveryDay() {
    const values = await this.getLatestCurrenciesFromExternalApi();

    Object.values(Currency).forEach(async (currency) => {
      await this.updateCurrencyValue({ currency, value: values[currency] });
    });

    this.logger.log('Currencies successfully updated');
  }

  async convert(
    amount: number,
    from: Currency,
    to: Currency,
    transaction?: Transaction,
  ) {
    if (from === to) return amount;

    const fromValue = await this.getCurrencyValue(from, transaction);
    const toValue = await this.getCurrencyValue(to, transaction);

    if (!fromValue || !toValue) throw new Error('Currency not found');

    const result = (amount * fromValue.value) / toValue.value;
    return Number(result.toFixed(4));
  }

  async hasCurrencies() {
    return (
      (await this.currencyValueRepository.count()) ===
      Object.values(Currency).length
    );
  }

  async hasToDayCurrencies() {
    const currencies = await this.currencyValueRepository.findAll({
      where: {
        updatedAt: {
          [Op.gt]: new Date(new Date().setDate(new Date().getDate() - 1)),
        },
      },
    });
    return currencies.length === Object.values(Currency).length;
  }

  async createCurrencyValue(currencyValue: CurrencyValueCreationAttrs) {
    return await this.currencyValueRepository.create(currencyValue);
  }

  async updateCurrencyValue(currencyValue: CurrencyValueCreationAttrs) {
    return await this.currencyValueRepository.update(currencyValue, {
      where: { currency: currencyValue.currency },
    });
  }

  async getCurrencyValue(currency: Currency, transaction?: Transaction) {
    return await this.currencyValueRepository.findOne({
      where: { currency },
      transaction,
    });
  }

  async getLatestCurrenciesFromExternalApi() {
    const response = await axios.get<CbrXmlDailyResponse>(
      'https://www.cbr-xml-daily.ru/daily_json.js',
    );

    return {
      USD: response.data.Valute.USD.Value,
      EUR: response.data.Valute.EUR.Value,
      RUB: 1,
    };
  }
}
