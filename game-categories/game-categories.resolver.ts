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
import { CtxCurrency } from 'src/auth/ctx-currency.decorator';
import { CtxLocale } from 'src/auth/ctx-locale.decorator';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { GameService } from 'src/games/games.service';
import { GlobalCategoriesService } from 'src/global-categories/global-categories.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { Currency, Locale, type GameCategory } from 'src/graphql';
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { ProductService } from 'src/products/products.service';
import { AddGameCategoryOptionDto } from './dto/add-game-category-option.dto';
import { CreateGameCategoryDto } from './dto/create-game-category.dto';
import { UpdateGameCategoryOptionDto } from './dto/update-game-category-option.dto';
import { UpdateGameCategoryDto } from './dto/update-game-category.dto';
import { GameCategoryService } from './game-categories.service';

@Resolver('GameCategory')
export class GameCategoryResolver {
  constructor(
    private readonly gameCategoryService: GameCategoryService,
    private readonly globalCategoriesService: GlobalCategoriesService,
    private readonly gamesService: GameService,
    private readonly productsService: ProductService,
    private readonly currenciesService: CurrenciesService,
    private readonly authGuard: AuthGuard,
  ) {}

  @Query()
  async gameCategories(
    @Args('pageInfo') dto: PageInfoDto,
    @Args('order') order: string,
    @Args('search') search?: string,
    @Args('gameId') gameId?: number,
    @Args('showHidden') showHidden: boolean = false,
  ) {
    return await this.gameCategoryService.findAllWithPagination(
      dto,
      order,
      search,
      gameId,
      showHidden,
    );
  }

  @Query()
  async adminGameCategories(
    @Args('pageInfo') dto: PageInfoDto,
    @Args('order') order: string,
    @Args('search') search?: string,
    @Args('gameId') gameId?: number,
    @Args('globalCategoryId') globalCategoryId?: number,
    @Args('visible') visible?: boolean,
    @Args('allowScreenshotsInProduct') allowScreenshotsInProduct?: boolean,
    @Args('sellerVerifiedPhone') sellerVerifiedPhone?: boolean,
    @Args('sellerVerfiedIdentity') sellerVerfiedIdentity?: boolean,
    @Args('showHidden') showHidden: boolean = false,
  ) {
    return await this.gameCategoryService.findAllWithPagination(
      dto,
      order,
      search,
      gameId,
      showHidden,
      globalCategoryId,
      visible,
      allowScreenshotsInProduct,
      sellerVerifiedPhone,
      sellerVerfiedIdentity,
    );
  }

  @Query()
  async gameCategory(@Args('id') id: number) {
    return await this.gameCategoryService.findById(id);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('game-categories.create')
  async createGameCategory(@Args() dto: CreateGameCategoryDto) {
    return await this.gameCategoryService.createGameCategory(dto);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('game-categories.update')
  async updateGameCategory(@Args() dto: UpdateGameCategoryDto) {
    return await this.gameCategoryService.updateGameCategory(dto.id, dto);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('game-categories.delete')
  async deleteGameCategory(@Args('id') id: number) {
    return await this.gameCategoryService.deleteGameCategory(id);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('game-categories.update')
  async updateGameCategoryOption(@Args() dto: UpdateGameCategoryOptionDto) {
    return await this.gameCategoryService.updateGameCategoryOption(dto.id, dto);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('game-categories.update')
  async addGameCategoryOption(@Args() dto: AddGameCategoryOptionDto) {
    return await this.gameCategoryService.addGameCategoryOption(dto);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('game-categories.delete')
  async deleteGameCategoryOption(@Args('id') id: number) {
    return await this.gameCategoryService.deleteGameCategoryOption(id);
  }

  @ResolveField()
  async options(@Parent() parent: GameCategory) {
    return await this.gameCategoryService.getGameCategoryOptions(parent.id);
  }

  @ResolveField()
  async globalCategory(@Parent() parent: GameCategory) {
    return await this.globalCategoriesService.findById(
      Number(parent.globalCategoryId),
    );
  }

  @ResolveField()
  async game(@Parent() parent: GameCategory) {
    return await this.gamesService.findById(Number(parent.gameId));
  }

  @ResolveField()
  async name(@Parent() parent: GameCategory, @CtxLocale() locale: Locale) {
    const translation =
      await this.gameCategoryService.getGameCategoryTranslation(
        parent.id,
        locale,
      );
    return translation?.label;
  }

  @ResolveField()
  async translations(@Parent() parent: GameCategory) {
    return await this.gameCategoryService.getGameCategoryTranslations(
      parent.id,
    );
  }

  @ResolveField()
  async countProducts(@Parent() parent: GameCategory) {
    return await this.productsService.countProductsByGameCategoryId(parent.id);
  }

  @ResolveField()
  async minOrderPrice(
    @Parent() parent: GameCategory,
    @CtxCurrency() currency: Currency,
  ) {
    return await this.currenciesService.convert(
      parent.minOrderPrice!,
      Currency.RUB,
      currency,
    );
  }

  @ResolveField()
  async countMyProducts(
    @Parent() parent: GameCategory,
    @Context('req') req: Request,
  ) {
    if (!req.headers.authorization) return null;

    try {
      const user = await this.authGuard.getUserByAuthHeader(
        req.headers.authorization,
      );

      return await this.productsService.countProductsByGameCategoryIdAndUser(
        parent.id,
        user.id,
      );
    } catch {
      return null;
    }
  }
}
