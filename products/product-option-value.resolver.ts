import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { GameCategoryService } from 'src/game-categories/game-categories.service';
import { GameOptionType, Locale, type ProductOptionValue } from 'src/graphql';

@Resolver('ProductOptionValue')
export class ProductOptionValueResolver {
  constructor(private readonly gameCategoryService: GameCategoryService) {}

  @ResolveField()
  async gameCategoryOption(@Parent() parent: ProductOptionValue) {
    return await this.gameCategoryService.getGameCategoryOptionById(
      parent.gameCategoryOptionId,
    );
  }

  @ResolveField()
  async valueString(
    @Parent() parent: ProductOptionValue,
    @CtxLocale() locale: Locale,
  ) {
    try {
      const categoryOption =
        await this.gameCategoryService.getGameCategoryOptionById(
          parent.gameCategoryOptionId,
        );

      if (categoryOption?.type === GameOptionType.range) {
        return null;
      }

      const translation =
        await this.gameCategoryService.getGameCategoryOptionValueTranslationsById(
          Number(parent.value),
          locale,
        );

      return translation?.name;
    } catch {
      return null;
    }
  }
}
