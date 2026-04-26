import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CurrenciesResolver } from './currencies.resolver';
import { CurrenciesService } from './currencies.service';
import { CurrencyValue } from './models/currency-value.model';

@Module({
  imports: [SequelizeModule.forFeature([CurrencyValue])],
  providers: [CurrenciesService, CurrenciesResolver],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}
