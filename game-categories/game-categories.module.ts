import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';
import { GameModule } from 'src/games/games.module';
import { GlobalCategoriesModule } from 'src/global-categories/global-categories.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { ProductModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { GameCategoryResolver } from './game-categories.resolver';
import { GameCategoryService } from './game-categories.service';
import { GameCategoryOptionValueResolver } from './game-cateogries-options-values.resolver';
import { GameCategoryOptionResolver } from './game-cateogries-options.resolver';
import { GameCategoryOptionTranslation } from './models/game-categories-options-translations.model';
import { GameCategoryOptionValueTranslation } from './models/game-categories-options-values-translations.model';
import { GameCategoryOptionValue } from './models/game-categories-options-values.model';
import { GameCategoryOption } from './models/game-categories-options.model';
import { GameCategoryTranslation } from './models/game-categories-translations.model';
import { GameCategory } from './models/game-categories.model';
import { SuggestedGameCategory } from './models/suggested-game-categories.model';
import { SuggestedGameCategoryResolver } from './suggested-game-categories.resolver';

@Module({
  imports: [
    SequelizeModule.forFeature([
      GameCategory,
      GameCategoryTranslation,
      GameCategoryOption,
      GameCategoryOptionTranslation,
      GameCategoryOptionValue,
      GameCategoryOptionValueTranslation,
      SuggestedGameCategory,
    ]),

    forwardRef(() => GameModule),
    forwardRef(() => GlobalCategoriesModule),
    forwardRef(() => ProductModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    PermissionsModule,
    CurrenciesModule,
  ],
  providers: [
    GameCategoryResolver,
    GameCategoryOptionResolver,
    GameCategoryOptionValueResolver,
    SuggestedGameCategoryResolver,
    GameCategoryService,
  ],
  exports: [GameCategoryService],
})
export class GameCategoryModule {}
