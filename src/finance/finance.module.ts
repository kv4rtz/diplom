import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { FinanceResolver } from './finance.resolver';
import { FinanceService } from './finance.service';
import { Finance } from './models/finance.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Finance]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  providers: [FinanceResolver, FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
