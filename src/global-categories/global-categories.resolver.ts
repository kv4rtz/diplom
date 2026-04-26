import { BadRequestException, UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { ErrorCause } from 'src/errors-couse';
import { GameCategoryService } from 'src/game-categories/game-categories.service';
import { GameService } from 'src/games/games.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { GlobalCategoryType, Locale, type GlobalCategory } from 'src/graphql';
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { ProductService } from 'src/products/products.service';
import { CreateGlobalCategoryDto } from './dto/create-global-category.dto';
import { UpdateGlobalCategoryDto } from './dto/update-global-category.dto';
import { GlobalCategoriesService } from './global-categories.service';

@Resolver('GlobalCategory')
export class GlobalCategoriesResolver {
  constructor(
    private readonly globalCategoriesService: GlobalCategoriesService,
    private readonly gameCategoryService: GameCategoryService,
    private readonly gamesService: GameService,
    private readonly productsService: ProductService,
  ) {}

  @Query()
  async globalCategories(
    @Args('pageInfo') dto: PageInfoDto,
    @Args('order') order?: string,
    @Args('search') search?: string,
    @Args('showHidden') showHidden?: boolean,
    @Args('type') type?: GlobalCategoryType,
  ) {
    return await this.globalCategoriesService.findAllWithPagination(
      dto,
      order,
      search,
      showHidden,
      type,
    );
  }

  @Query()
  async globalCategory(@Args('id') id: number) {
    const globalCategory = await this.globalCategoriesService.findById(id);
    if (!globalCategory) throw new BadRequestException(ErrorCause.NOT_FOUND);
    return globalCategory;
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('global-categories.create')
  async createGlobalCategory(@Args() dto: CreateGlobalCategoryDto) {
    return await this.globalCategoriesService.createGlobalCategory(dto);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('global-categories.update')
  async updateGlobalCategory(@Args() dto: UpdateGlobalCategoryDto) {
    return await this.globalCategoriesService.updateGlobalCategory(dto.id, dto);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('global-categories.delete')
  async deleteGlobalCategory(@Args('id') id: number) {
    return !!(await this.globalCategoriesService.deleteGlobalCategory(id));
  }

  @ResolveField()
  async name(
    @Parent() globalCategory: GlobalCategory,
    @CtxLocale() locale: Locale,
  ) {
    const translation =
      await this.globalCategoriesService.getGlobalCaregoryTranslation(
        Number(globalCategory.id),
        locale,
      );
    return translation?.name;
  }

  @ResolveField()
  async description(
    @Parent() globalCategory: GlobalCategory,
    @CtxLocale() locale: Locale,
  ) {
    const translation =
      await this.globalCategoriesService.getGlobalCaregoryTranslation(
        Number(globalCategory.id),
        locale,
      );
    return translation?.description;
  }

  @ResolveField()
  async translations(@Parent() globalCategory: GlobalCategory) {
    return await this.globalCategoriesService.getGlobalCaregoryTranslations(
      Number(globalCategory.id),
    );
  }

  @ResolveField()
  async countGameCategories(@Parent() globalCategory: GlobalCategory) {
    return await this.gameCategoryService.countGameCategoriesByGlobalCategoryId(
      Number(globalCategory.id),
    );
  }

  @ResolveField()
  async games(@Parent() globalCategory: GlobalCategory) {
    return await this.gamesService.getAllByGlobalCategoryId(
      Number(globalCategory.id),
    );
  }

  @ResolveField()
  async products(@Parent() globalCategory: GlobalCategory) {
    return await this.productsService.getAllByGlobalCategoryId(
      Number(globalCategory.id),
    );
  }
}
