import { MailerModule } from '@nestjs-modules/mailer';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { SequelizeModule } from '@nestjs/sequelize';
import { WinstonModule } from 'nest-winston';
import { AchievementsModule } from './achievements/achievements.module';
import { AuthModule } from './auth/auth.module';
import { BgrModule } from './bgr/bgr.module';
import { ChatsModule } from './chats/chats.module';
import { CommissionsModule } from './commissions/commissions.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { EventsModule } from './events/events.module';
import { FinanceModule } from './finance/finance.module';
import { GameCategoryModule } from './game-categories/game-categories.module';
import { GameModule } from './games/games.module';
import { GeneralModule } from './general/general.module';
import { GlobalCategoriesModule } from './global-categories/global-categories.module';
import { GQLConfig } from './global/apollo-driver-config';
import { CacheConfig } from './global/cache-config';
import { loggerConfig } from './global/logger/logger';
import { MailerConfig } from './global/mailer-config';
import { SequalizeConfig } from './global/sequalize-config';
import { IpModule } from './ip/ip.module';
import { KafkaModule } from './kafka/kafka.module';
import { MessagesModule } from './messages/messages.module';
import { MetricsModule } from './metrics/metrics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ProductModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RolesModule } from './roles/roles.module';
import { SessionsModule } from './sessions/sessions.module';
import { StorageModule } from './storage/storage.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    WinstonModule.forRoot(loggerConfig),
    GraphQLModule.forRoot<ApolloDriverConfig>(new GQLConfig()),
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({ useClass: SequalizeConfig }),
    MailerModule.forRootAsync({ useClass: MailerConfig }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({ useClass: CacheConfig, isGlobal: true }),
    MetricsModule,
    UsersModule,
    AuthModule,
    SessionsModule,
    RolesModule,
    PermissionsModule,
    GlobalCategoriesModule,
    GameModule,
    ProductModule,
    GameCategoryModule,
    NotificationsModule,
    EventsModule,
    ChatsModule,
    MessagesModule,
    ReviewsModule,
    StorageModule,
    KafkaModule,
    CurrenciesModule,
    FinanceModule,
    TransactionsModule,
    OrdersModule,
    IpModule,
    CommissionsModule,
    GeneralModule,
    BgrModule,
    AchievementsModule,
    TicketsModule,
    SmsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
