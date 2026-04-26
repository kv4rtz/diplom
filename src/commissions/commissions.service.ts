import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { ComissionType, Currency, Locale } from 'src/graphql';
import { ComissionTranslation } from './models/comission-translations.model';
import { Comission } from './models/comissions.model';
import { DEFAULT_COMISSIONS } from './models/default-comissions.constant';

@Injectable()
export class CommissionsService implements OnModuleInit {
  constructor(
    @InjectModel(Comission)
    private readonly comissionsRepository: typeof Comission,
    @InjectModel(ComissionTranslation)
    private readonly comissionTranslationsRepository: typeof ComissionTranslation,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async onModuleInit() {
    await this.createDefaultCommissions();
  }

  async findOneById(id: number) {
    return await this.comissionsRepository.findOne({
      where: { id },
    });
  }

  async findComissionByUniqueId(uniqueId: string) {
    return await this.comissionsRepository.findOne({
      where: { uniqueId },
    });
  }

  async getPriceWithBaseComission(amount: number) {
    const baseComission =
      await this.findComissionByUniqueId('base-replenishment');

    return amount * (1 + Number(baseComission?.percentage || 0) / 100);
  }

  async calculateMinCost(
    amount: number,
    type: ComissionType,
    currency: Currency,
  ) {
    const baseComission =
      await this.findComissionByUniqueId('base-replenishment');
    const baseComissionPercentage = baseComission?.percentage || 0;
    const comission = await this.comissionsRepository.findOne({
      where: { type, currency },
      order: [['percentage', 'ASC']],
    });

    return Number(
      (
        amount *
        (1 + Number(baseComissionPercentage) / 100) *
        (1 + Number(comission?.percentage) / 100)
      ).toFixed(2),
    );
  }

  async calculateCostByCommission(
    amount: number,
    commissionUniqueId: string,
    currency: Currency,
  ) {
    const baseComission =
      await this.findComissionByUniqueId('base-replenishment');

    const baseComissionPercentage = baseComission?.percentage || 0;

    const comission = await this.comissionsRepository.findOne({
      where: { uniqueId: commissionUniqueId },
    });

    const convertedAmount = await this.currenciesService.convert(
      amount,
      currency,
      comission?.currency!,
    );

    const commissionAmount =
      convertedAmount *
      (1 + Number(baseComissionPercentage) / 100) *
      (1 + Number(comission?.percentage) / 100);

    return commissionAmount;
  }

  async calculateCost(amount: number, type: ComissionType, currency: Currency) {
    const baseComission =
      await this.findComissionByUniqueId('base-replenishment');

    const baseComissionPercentage = baseComission?.percentage || 0;

    const comissions = await this.comissionsRepository.findAll({
      where: { type },
    });
    const result: { commissionId: number; amount: number }[] = [];

    for (const comission of comissions) {
      if (!comission.currency) continue;

      const convertedAmount = await this.currenciesService.convert(
        amount,
        currency,
        comission.currency,
      );

      const commissionAmount =
        convertedAmount *
        (1 + Number(baseComissionPercentage) / 100) *
        (1 + Number(comission?.percentage) / 100);

      result.push({
        commissionId: comission.id,
        amount: Number(commissionAmount.toFixed(2)),
      });
    }

    return result;
  }

  async createDefaultCommissions() {
    try {
      for (const comission of DEFAULT_COMISSIONS) {
        await this.comissionsRepository.create(comission, {
          include: [{ model: ComissionTranslation, as: 'translations' }],
        });
      }
    } catch (e) {
      if (e instanceof UniqueConstraintError) return;
      throw e;
    }
  }

  async findAll() {
    return await this.comissionsRepository.findAll();
  }

  async findOneTranslationByCommissionId(comissionId: number, locale: Locale) {
    return await this.comissionTranslationsRepository.findOne({
      where: {
        comissionId,
        locale,
      },
    });
  }

  async findTranslationsByCommissionId(comissionId: number) {
    return await this.comissionTranslationsRepository.findAll({
      where: {
        comissionId,
      },
    });
  }

  async updateComission(comissionId: number, percentage: number) {
    const commission = await this.findOneById(comissionId);
    await commission?.update({ percentage });
    return await commission?.reload();
  }

  calcMinCostSql(currency: Currency, type: ComissionType) {
    return `
      (1 + (
        (select "comissions"."percentage" from "comissions" where "comissions"."uniqueId" = 'base-replenishment')
        +
        (select "comissions"."percentage" from "comissions" where "comissions"."type" = '${type}' and "comissions"."currency" = '${currency}' ORDER BY "comissions"."percentage" LIMIT 1)
      ) / 100)
    `;
  }
}
