import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { ChatsModule } from 'src/chats/chats.module';
import { CommissionsModule } from 'src/commissions/commissions.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';
import { FinanceModule } from 'src/finance/finance.module';
import { GameCategoryModule } from 'src/game-categories/game-categories.module';
import { GameModule } from 'src/games/games.module';
import { MessagesModule } from 'src/messages/messages.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { ProductModule } from 'src/products/products.module';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { StorageModule } from 'src/storage/storage.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UsersModule } from 'src/users/users.module';
import { OrderProductFileSnapshot } from './models/order-product-file-snapshot.model';
import { OrderProductOptionSnapshot } from './models/order-product-option-snapshot.model';
import { OrderProductSnapshot } from './models/order-product-snapshot.model';
import { OrderProductTranslationSnapshot } from './models/order-product-translation-snapshot.model';
import { Order } from './models/orders.model';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { OrdersProductSnapshotsResolver } from './ordersProductSnapshots.resolver';

@Module({
  imports: [
    SequelizeModule.forFeature([
      OrderProductSnapshot,
      OrderProductTranslationSnapshot,
      OrderProductOptionSnapshot,
      OrderProductFileSnapshot,
      Order,
    ]),
    PermissionsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    ProductModule,
    forwardRef(() => ReviewsModule),
    CurrenciesModule,
    FinanceModule,
    forwardRef(() => TransactionsModule),
    ChatsModule,
    MessagesModule,
    CommissionsModule,
    GameModule,
    GameCategoryModule,
    StorageModule,
  ],
  providers: [OrdersResolver, OrdersProductSnapshotsResolver, OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
