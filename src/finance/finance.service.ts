import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Finance, FinanceCreationAttrs } from './models/finance.model';

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Finance) private readonly financeRepository: typeof Finance,
  ) {}

  async findOrCreate(
    creationAttrs: FinanceCreationAttrs,
    transaction?: Transaction,
  ) {
    try {
      return await this.financeRepository.findOne({
        where: creationAttrs,
        transaction,
      });
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
      return await this.financeRepository.create(creationAttrs, {
        transaction,
      });
    }
  }

  async findById(id: number, transaction?: Transaction) {
    return await this.financeRepository.findByPk(id, { transaction });
  }

  async getSecurityDepositValue(userId: number) {
    const finance = await this.findOrCreate({ userId });

    return finance?.securityDeposit;
  }
}
