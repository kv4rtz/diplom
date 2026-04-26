import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { BgrModule } from 'src/bgr/bgr.module';
import { CommissionsModule } from 'src/commissions/commissions.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';
import { FinanceModule } from 'src/finance/finance.module';
import { GameCategoryModule } from 'src/game-categories/game-categories.module';
import { GameModule } from 'src/games/games.module';
import { IpModule } from 'src/ip/ip.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { StorageModule } from 'src/storage/storage.module';
import { UsersModule } from 'src/users/users.module';
import { ProductComplaint } from './models/product-complaints.model';
import { ProductFavourite } from './models/product-favourites.model';
import { ProductLot } from './models/product-lots.model';
import { ProductOption } from './models/product-options.model';
import { ProductTranslation } from './models/product-translations.model';
import { ProductView } from './models/product-views.model';
import { ProductFile } from './models/products-files.model';
import { Product } from './models/products.model';
import { ProductComplaintResolver } from './product-complaint.resolver';
import { ProductOptionValueResolver } from './product-option-value.resolver';
import { ProductResolver } from './products.resolver';
import { ProductService } from './products.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Product,
      ProductOption,
      ProductTranslation,
      ProductFile,
      ProductLot,
      ProductView,
      ProductFavourite,
      ProductComplaint,
    ]),
    StorageModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    PermissionsModule,
    forwardRef(() => GameCategoryModule),
    CurrenciesModule,
    CommissionsModule,
    forwardRef(() => GameModule),
    IpModule,
    forwardRef(() => ReviewsModule),
    FinanceModule,
    forwardRef(() => BgrModule),
  ],
  providers: [
    ProductResolver,
    ProductOptionValueResolver,
    ProductComplaintResolver,
    ProductService,
  ],
  exports: [ProductService],
})
export class ProductModule {}
