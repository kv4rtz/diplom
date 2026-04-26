import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { Locale, type GameCategoryOption } from 'src/graphql';
import { GameCategoryService } from './game-categories.service';

@Resolver('GameCategoryOption')
export class GameCategoryOptionResolver {
  constructor(private readonly gameCategoriesService: GameCategoryService) {}

  @ResolveField()
  async name(
    @Parent() parent: GameCategoryOption,
    @CtxLocale() locale: Locale,
  ) {
    const translation =
      await this.gameCategoriesService.getGameCategoryOptionTranslation(
        parent.id,
        locale,
      );

    return translation?.name;
  }

  @ResolveField()
  async translations(@Parent() parent: GameCategoryOption) {
    return await this.gameCategoriesService.getGameCategoryOptionTranslations(
      parent.id,
    );
  }

  @ResolveField()
  async values(@Parent() parent: GameCategoryOption) {
    return await this.gameCategoriesService.getGameCategoryOptionValuesByOptionId(
      parent.id,
    );
  }
}
