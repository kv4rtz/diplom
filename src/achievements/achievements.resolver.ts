import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { type Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { Locale } from 'src/graphql';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { AchievementsService } from './achievements.service';
import { GetAchievementsDto } from './dto/get-achievements.dto';
import { Achievement } from './models/achievements.model';

@Resolver('Achievement')
export class AchievementsResolver {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly storageService: StorageService,
    private readonly usersService: UsersService,
    private readonly authGuard: AuthGuard,
  ) {}

  @Query()
  async achievements(@Args() dto: GetAchievementsDto) {
    return await this.achievementsService.getAllAchievements(dto);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async pinMyAchievement(
    @Args('achievementId') achievementId: number,
    @Args('position') position: number,
    @CtxUser() user: User,
  ) {
    return await this.achievementsService.pinMyAchievement(
      user.id,
      achievementId,
      position,
    );
  }

  @ResolveField()
  async title(@Parent() achievement: Achievement, @CtxLocale() locale: Locale) {
    const t = await this.achievementsService.getAchievementTranslation(
      achievement.id,
      locale,
    );
    return t?.title || '';
  }

  @ResolveField()
  async description(
    @Parent() achievement: Achievement,
    @CtxLocale() locale: Locale,
  ) {
    const t = await this.achievementsService.getAchievementTranslation(
      achievement.id,
      locale,
    );
    return t?.description || '';
  }

  @ResolveField()
  async translations(@Parent() achievement: Achievement) {
    return await this.achievementsService.getAchievementTranslations(
      achievement.id,
    );
  }

  @ResolveField()
  async icon(@Parent() achievement: Achievement) {
    const url = await this.storageService.getDownloadUrl(
      achievement.iconKey,
      StorageBuckets.Achievements,
    );
    return url.split('?')[0];
  }

  @ResolveField()
  async percentageOfUsers(@Parent() achievement: Achievement) {
    const countAllUsers = await this.usersService.countAllUsers();
    if (countAllUsers === 0) return 0;

    const countUsersWithAchievement =
      await this.achievementsService.countUsersWithAchievement(achievement.id);

    return Number.parseFloat(
      ((countUsersWithAchievement / countAllUsers) * 100).toFixed(2),
    );
  }

  @ResolveField()
  async having(
    @Parent() achievement: Achievement,
    @Context('req') req: Request,
  ) {
    if (!req.headers.authorization) return false;

    try {
      const user = await this.authGuard.getUserByAuthHeader(
        req.headers.authorization,
      );

      const achievementUser =
        await this.achievementsService.getAchievementUserByUserIdAndAchievementId(
          user.id,
          achievement.id,
        );

      return achievementUser ? true : false;
    } catch {
      return false;
    }
  }
}
