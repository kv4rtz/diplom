import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, Sequelize } from 'sequelize';
import { OrdersService } from 'src/orders/orders.service';
import { ReviewsService } from 'src/reviews/reviews.service';
import { UsersService } from 'src/users/users.service';
import { BGR_CONFIG } from './bgr.config';
import { BgrHistory } from './models/bgr-history.model';
import { BgrPenalty, PenaltyType } from './models/bgr-penalty.model';
import { deleteOldHistoryBgrRecordsFnPlpgsql } from './models/delete-old-history-bgr-records';

@Injectable()
export class BgrService implements OnModuleInit {
  constructor(
    @InjectConnection() private readonly connection: Sequelize,
    @InjectModel(BgrHistory)
    private readonly bgrHistoryRepository: typeof BgrHistory,
    @InjectModel(BgrPenalty)
    private readonly bgrPenaltyRepository: typeof BgrPenalty,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersSerivce: OrdersService,
    private readonly reviewsService: ReviewsService,
    private readonly usersService: UsersService,
  ) {}

  public readonly config = BGR_CONFIG;

  async caluclateBgrWithoutPenaltiesViaOptions(options: {
    quantityOfSales: number;
    sumOfSales: number;
    averageRating: number;
    hasConsecutiveReviews: boolean;
    countOrders: number;
  }) {
    const salesVolumeScore =
      this.config.base.newbieRating +
      this.config.salesVolume.logMultiplier *
        Math.log10(
          1 + options.quantityOfSales * this.config.salesVolume.quantityScale,
        );

    const revenueScore =
      this.config.revenue.logMultiplier *
      Math.log10(
        1 + options.sumOfSales / this.config.revenue.normalizationAmount,
      );
    const baseScore = salesVolumeScore + revenueScore;

    const averageSumOfSales = options.sumOfSales / options.quantityOfSales;
    const avgCheckWeight = Math.min(
      options.quantityOfSales / this.config.avgOrderValue.ordersForFullWeight,
      1,
    );
    const avgOrderValueMultiplier =
      1 -
      avgCheckWeight +
      avgCheckWeight *
        Math.pow(
          Math.min(
            averageSumOfSales / this.config.avgOrderValue.normalizationAmount,
            this.config.avgOrderValue.maxBoost,
          ),
          this.config.avgOrderValue.power,
        );

    let ratingMultiplier =
      options.averageRating > 0
        ? this.config.rating.baseMultiplier +
          options.averageRating / this.config.rating.maxRating
        : this.config.rating.noRatingMultiplier;

    ratingMultiplier *= options.hasConsecutiveReviews
      ? this.config.rating.consecutiveLowRatingPenalty
      : 1;

    const completionRateMultiplier =
      options.countOrders > 0
        ? this.config.completionRate.baseMultiplier +
          this.config.completionRate.maxBonus *
            (options.quantityOfSales / options.countOrders)
        : this.config.completionRate.baseMultiplier;

    const calculatedBgr =
      baseScore *
      avgOrderValueMultiplier *
      ratingMultiplier *
      completionRateMultiplier;

    return (
      Math.round(
        Math.max(0, Math.min(calculatedBgr, this.config.limits.max)),
      ) || this.config.limits.min
    );
  }

  async calculateAndSavePenaltiesByUserId(
    userId: number,
    bgrWithoutPenalties: number,
  ) {
    const daysWithoutSales =
      await this.ordersSerivce.countDaysWithoutSalesByUserId(userId);

    const refundedOrders =
      await this.ordersSerivce.countRefundedOrdersBySellerId(userId);

    const refundPenalty =
      refundedOrders * this.config.penalties.refundMultiplier;

    let lastIdlePenalty: BgrPenalty | null = null;
    try {
      lastIdlePenalty = await this.bgrPenaltyRepository.findOne({
        where: { userId, penaltyType: PenaltyType.IDLE },
        order: [['createdAt', 'DESC']],
      });
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
    }

    let idlePenalty = 0;
    let isInIdlePenaltyImmunity = false;

    if (daysWithoutSales >= this.config.penalties.minDaysWithoutSales) {
      const now = new Date();
      if (lastIdlePenalty && now < new Date(lastIdlePenalty.appliedUntil)) {
        isInIdlePenaltyImmunity = true;
        idlePenalty = lastIdlePenalty.penaltyAmount;
      }

      if (!isInIdlePenaltyImmunity) {
        const basePenalty =
          this.config.penalties.getBaseIdlePenaltyByBgr(bgrWithoutPenalties);

        let previousPenaltiesInCycle = lastIdlePenalty?.cycleIndex ?? 0;
        if (
          lastIdlePenalty &&
          lastIdlePenalty.cycleIndex >= this.config.penalties.maxCycleIndex
        ) {
          previousPenaltiesInCycle = 0;
        }

        idlePenalty = Math.round(
          basePenalty * Math.pow(0.5, previousPenaltiesInCycle),
        );

        const appliedUntil = new Date();
        appliedUntil.setDate(appliedUntil.getDate() + 30);

        await this.bgrPenaltyRepository.create({
          userId,
          penaltyType: PenaltyType.IDLE,
          penaltyAmount: idlePenalty,
          appliedUntil,
          cycleIndex: previousPenaltiesInCycle + 1,
        });
      }
    }

    return {
      idlePenalty,
      refundPenalty,
    };
  }

  async onModuleInit() {
    await deleteOldHistoryBgrRecordsFnPlpgsql(
      this.connection,
      this.bgrHistoryRepository.tableName,
    );
    await this.autoSaveAllUsersBgr();
  }

  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async autoSaveAllUsersBgr() {
    try {
      const users = await this.usersService.getAllUsers();

      for (const user of users) {
        try {
          const hasWeeklyRecord = await this.hasBgrThisWeek(user.id);

          if (!hasWeeklyRecord) {
            await this.calcBgrByUserId(user.id);
          }
        } catch (error) {}
      }
    } catch (error) {}
  }

  async getPlaceInTop(userId: number, date: Date = new Date()) {
    const weekStart = this.getMondayUTC(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const query = `
      WITH ranked_users AS (
        SELECT 
          "userId",
          bgr,
          ROW_NUMBER() OVER (ORDER BY bgr DESC, "createdAt" ASC) as rank,
          COUNT(*) OVER () as total
        FROM "${this.bgrHistoryRepository.tableName}"
        WHERE "createdAt" BETWEEN :weekStart AND :weekEnd
          AND bgr > 0
      )
      SELECT rank, total
      FROM ranked_users
      WHERE "userId" = :userId
    `;

    const [result] = await this.connection.query<{
      rank: number;
      total: number;
    }>(query, {
      replacements: {
        userId,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      },
      type: QueryTypes.SELECT,
    });

    return result || null;
  }

  async saveBgrToHistory(userId: number, bgr: number) {
    const now = new Date();
    const weekStart = this.getMondayUTC(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    let record: BgrHistory | null = null;
    try {
      record = await this.bgrHistoryRepository.findOne({
        where: {
          userId,
          createdAt: {
            [Op.between]: [weekStart, weekEnd],
          },
        },
      });
    } catch {}

    if (record) {
      record.bgr = bgr;
      await record.save();
    } else {
      record = await this.bgrHistoryRepository.create({
        userId,
        bgr,
      });
    }

    return record;
  }

  async getBgrHistoryForLast6Weeks(
    userId: number,
  ): Promise<Array<{ date: string; bgr: number }>> {
    const result: Array<{ date: string; bgr: number }> = [];
    const now = new Date();

    const currentMondayUTC = this.getMondayUTC(now);

    for (let i = 5; i >= 0; i--) {
      const mondayUTC = new Date(currentMondayUTC);
      mondayUTC.setUTCDate(mondayUTC.getUTCDate() - i * 7);

      const sundayUTC = new Date(mondayUTC);
      sundayUTC.setUTCDate(sundayUTC.getUTCDate() + 6);
      sundayUTC.setUTCHours(23, 59, 59, 999);

      let record: BgrHistory | null = null;
      try {
        record = await this.bgrHistoryRepository.findOne({
          where: {
            userId,
            createdAt: {
              [Op.between]: [mondayUTC, sundayUTC],
            },
          },
          order: [['createdAt', 'DESC']],
        });
      } catch (error) {}

      const formattedDate = this.formatDateUTC(mondayUTC);

      result.push({
        date: formattedDate,
        bgr: record ? Number(record.bgr) : 0,
      });
    }

    return result;
  }

  private getMondayUTC(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private formatDateUTC(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  async calcBgrByUserId(userId: number): Promise<number> {
    try {
      const quantityOfSales =
        await this.ordersSerivce.countSuccessOrdersBySellerId(userId);

      if (quantityOfSales === 0) {
        await this.saveBgrToHistory(userId, 0);
        return 0;
      }

      const sumOfSales =
        await this.ordersSerivce.sumOfSuccessOrdersBySellerId(userId);
      const averageRating =
        (await this.reviewsService.countAverageRatingBySellerId(userId)) || 0;
      const hasConsecutiveReviews =
        await this.reviewsService.hasConsecutiveBadReviewsForSeller(userId, 7);
      const countOrders =
        await this.ordersSerivce.countOrdersBySellerId(userId);

      const bgrWithoutPenalties =
        await this.caluclateBgrWithoutPenaltiesViaOptions({
          quantityOfSales,
          sumOfSales,
          averageRating,
          hasConsecutiveReviews,
          countOrders,
        });

      const { idlePenalty, refundPenalty } =
        await this.calculateAndSavePenaltiesByUserId(
          userId,
          bgrWithoutPenalties,
        );
      const bgr = bgrWithoutPenalties - idlePenalty - refundPenalty;

      await this.saveBgrToHistory(userId, bgr);

      return bgr;
    } catch (error) {
      return 0;
    }
  }

  private async hasBgrThisWeek(userId: number): Promise<boolean> {
    const now = new Date();
    const currentMondayUTC = this.getMondayUTC(now);

    const sundayUTC = new Date(currentMondayUTC);
    sundayUTC.setUTCDate(sundayUTC.getUTCDate() + 6);
    sundayUTC.setUTCHours(23, 59, 59, 999);

    try {
      const record = await this.bgrHistoryRepository.findOne({
        where: {
          userId,
          createdAt: {
            [Op.between]: [currentMondayUTC, sundayUTC],
          },
        },
      });

      return !!record;
    } catch (error) {
      return false;
    }
  }
}
