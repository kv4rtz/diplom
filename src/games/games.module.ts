import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { GameCategoryModule } from 'src/game-categories/game-categories.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { ProductModule } from 'src/products/products.module';
import { StorageModule } from 'src/storage/storage.module';
import { UsersModule } from 'src/users/users.module';
import { GameResolver } from './games.resolver';
import { GameService } from './games.service';
import { GameFavourite } from './models/game-favourites.model';
import { GameSearch } from './models/game-searches.model';
import { GameTranslation } from './models/game-translations.model';
import { Game } from './models/games.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Game,
      GameTranslation,
      GameSearch,
      GameFavourite,
    ]),
    StorageModule,
    forwardRef(() => GameCategoryModule),
    forwardRef(() => ProductModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    PermissionsModule,
  ],
  providers: [GameResolver, GameService],
  exports: [GameService],
})
export class GameModule {}
