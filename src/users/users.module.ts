import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BgrModule } from 'src/bgr/bgr.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';
import { FinanceModule } from 'src/finance/finance.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { OrdersModule } from 'src/orders/orders.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { ProductModule } from 'src/products/products.module';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { RolesModule } from 'src/roles/roles.module';
import { SmsModule } from 'src/sms/sms.module';
import { StorageModule } from 'src/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { UserBlacklist } from './models/users-blacklist.model';
import { UserCode } from './models/users-codes.model';
import { UserComplaint } from './models/users-complaints.model';
import { UserOAuthAccount } from './models/users-oauth-accounts.model';
import { UserOption } from './models/users-options.model';
import { UserRole } from './models/users-roles.model';
import { User } from './models/users.model';
import { PublicProfileResolver } from './public-profile.resolver';
import { UsersComplaintsResolver } from './users-complaints.resolver';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      UserRole,
      UserCode,
      UserOAuthAccount,
      UserComplaint,
      UserBlacklist,
      UserOption,
    ]),
    forwardRef(() => RolesModule),
    NotificationsModule,
    StorageModule,
    KafkaModule,
    SmsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => FinanceModule),
    forwardRef(() => ReviewsModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => BgrModule),
    forwardRef(() => CurrenciesModule),
    forwardRef(() => ProductModule),
    forwardRef(() => PermissionsModule),
  ],
  providers: [
    UsersResolver,
    UsersService,
    UsersComplaintsResolver,
    PublicProfileResolver,
  ],
  exports: [UsersService],
})
export class UsersModule {}
