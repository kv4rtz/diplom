import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { GameCategoryModule } from 'src/game-categories/game-categories.module';
import { GameModule } from 'src/games/games.module';
import { OrdersModule } from 'src/orders/orders.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { ProductModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { Review } from './reviews.model';
import { ReviewsResolver } from './reviews.resolver';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Review]),
    PermissionsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ProductModule),
    forwardRef(() => UsersModule),
    forwardRef(() => OrdersModule),
    GameModule,
    GameCategoryModule,
  ],
  providers: [ReviewsResolver, ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
