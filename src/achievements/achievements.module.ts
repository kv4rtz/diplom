import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { StorageModule } from 'src/storage/storage.module';
import { UsersModule } from 'src/users/users.module';
import { AchievementsResolver } from './achievements.resolver';
import { AchievementsService } from './achievements.service';
import { AchievementTranslation } from './models/achievements-translations.model';
import { AchievementUser } from './models/achievements-users.model';
import { Achievement } from './models/achievements.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Achievement,
      AchievementTranslation,
      AchievementUser,
    ]),
    StorageModule,
    UsersModule,
    AuthModule,
  ],
  providers: [AchievementsResolver, AchievementsService],
})
export class AchievementsModule {}
