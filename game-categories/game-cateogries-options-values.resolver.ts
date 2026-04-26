import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { Locale } from 'src/graphql';
import { GameCategoryService } from './game-categories.service';
import { GameCategoryOptionValue } from './models/game-categories-options-values.model';

@Resolver('GameCategoryOptionValue')
export class GameCategoryOptionValueResolver {
  constructor(private readonly gameCategoriesService: GameCategoryService) {}

  @ResolveField()
  async name(
    @Parent() parent: GameCategoryOptionValue,
    @CtxLocale() locale: Locale,
  ) {
    const translation =
      await this.gameCategoriesService.getGameCategoryOptionValueTranslation(
        parent.id,
        locale,
      );

    return translation?.name;
  }

  @ResolveField()
  async translations(@Parent() parent: GameCategoryOptionValue) {
    return await this.gameCategoriesService.getGameCategoryOptionValueTranslations(
      parent.id,
    );
  }
}
