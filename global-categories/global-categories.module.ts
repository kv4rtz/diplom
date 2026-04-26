import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { GameCategoryModule } from 'src/game-categories/game-categories.module';
import { GameModule } from 'src/games/games.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { ProductModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { GlobalCategoriesResolver } from './global-categories.resolver';
import { GlobalCategoriesService } from './global-categories.service';
import { GlobalCategoryTranslation } from './models/global-categories-translations.model';
import { GlobalCategory } from './models/global-categories.model';

@Module({
  imports: [
    SequelizeModule.forFeature([GlobalCategory, GlobalCategoryTranslation]),
    forwardRef(() => GameCategoryModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    PermissionsModule,
    GameModule,
    forwardRef(() => ProductModule),
  ],
  providers: [GlobalCategoriesResolver, GlobalCategoriesService],
  exports: [GlobalCategoriesService],
})
export class GlobalCategoriesModule {}
