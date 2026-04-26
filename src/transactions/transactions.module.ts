import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { CommissionsModule } from 'src/commissions/commissions.module';
import { FinanceModule } from 'src/finance/finance.module';
import { IpModule } from 'src/ip/ip.module';
import { OrdersModule } from 'src/orders/orders.module';
import { ProductModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { Transaction } from './model/transactions.model';
import { TransactionsController } from './transactions.controller';
import { TransactionsResolver } from './transactions.resolver';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Transaction]),
    FinanceModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    IpModule,
    forwardRef(() => OrdersModule),
    CommissionsModule,
    forwardRef(() => ProductModule),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsResolver, TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
