import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IncludeOptions, Op, WhereOptions } from 'sequelize';
import { ErrorCause } from 'src/errors-couse';
import { Locale } from 'src/graphql';
import { User } from 'src/users/models/users.model';
import { GetAchievementsDto } from './dto/get-achievements.dto';
import { AchievementTranslation } from './models/achievements-translations.model';
import { AchievementUser } from './models/achievements-users.model';
import { Achievement } from './models/achievements.model';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectModel(Achievement)
    private readonly achievementsRepository: typeof Achievement,
    @InjectModel(AchievementTranslation)
    private readonly achievementsTranlationRepository: typeof AchievementTranslation,
    @InjectModel(AchievementUser)
    private readonly achievementsUsersRepository: typeof AchievementUser,
  ) {}

  async getAllAchievements(dto: GetAchievementsDto) {
    const where: WhereOptions<Achievement> = {};
    if (dto.type) where.type = dto.type;

    const include: IncludeOptions[] = [];
    if (dto.userId) {
      const throughAchievementUserWhere: WhereOptions<AchievementUser> = {};
      if (dto.onlyPinned)
        throughAchievementUserWhere.positionInPinning = { [Op.ne]: null };
      include.push({
        model: User,
        required: true,
        where: { id: dto.userId },
        through: { where: throughAchievementUserWhere },
      });
    }

    const achievements = await this.achievementsRepository.findAll({
      where,
      include,
    });

    if (dto.onlyPinned && dto.userId) {
      return achievements.sort((a, b) => {
        const posA = (a as any).users?.[0]?.AchievementUser?.positionInPinning;
        const posB = (b as any).users?.[0]?.AchievementUser?.positionInPinning;
        return posA - posB;
      });
    }

    return achievements;
  }

  async getAchievementTranslation(achievementId: number, locale: Locale) {
    return await this.achievementsTranlationRepository.findOne({
      where: {
        achievementId,
        locale,
      },
    });
  }

  async getAchievementTranslations(achievementId: number) {
    return await this.achievementsTranlationRepository.findAll({
      where: {
        achievementId,
      },
    });
  }

  async countUsersWithAchievement(achievementId: number) {
    return await this.achievementsUsersRepository.count({
      where: { achievementId },
    });
  }

  async getAchievementUserByUserIdAndAchievementId(
    userId: number,
    achievementId: number,
  ) {
    return await this.achievementsUsersRepository.findOne({
      where: { userId, achievementId },
    });
  }

  async pinMyAchievement(
    userId: number,
    achievementId: number,
    position: number,
  ) {
    let achievementUser: AchievementUser | null = null;
    try {
      achievementUser = await this.achievementsUsersRepository.findOne({
        where: { userId, achievementId },
      });
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
      throw new ForbiddenException(ErrorCause.YOU_NOT_HAVE_THIS_ACHIEVEMENT);
    }

    if (position > 6)
      throw new BadRequestException(ErrorCause.INVALID_PINNING_POSITION);

    if (position > 0) {
      achievementUser!.positionInPinning = null;
    } else {
      try {
        const au = await this.achievementsUsersRepository.findOne({
          where: { userId, positionInPinning: position },
        });
        if (au) {
          au.positionInPinning = null;
          await au.save();
        }
      } catch {}
      achievementUser!.positionInPinning = position;
    }
    await achievementUser!.save();

    return true;
  }
}
