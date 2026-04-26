import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { UsersModule } from 'src/users/users.module';
import { CommissionsResolver } from './commissions.resolver';
import { CommissionsService } from './commissions.service';
import { CostCalculatedResolver } from './cost-calculated.resolver';
import { ComissionTranslation } from './models/comission-translations.model';
import { Comission } from './models/comissions.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Comission, ComissionTranslation]),
    CurrenciesModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    PermissionsModule,
  ],
  providers: [CommissionsResolver, CostCalculatedResolver, CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
