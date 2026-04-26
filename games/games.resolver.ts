import { BadRequestException, UseGuards } from '@nestjs/common';
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
import { ErrorCause } from 'src/errors-couse';
import { GameCategoryService } from 'src/game-categories/game-categories.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { GameType, Locale, OrderDirection, type Game } from 'src/graphql';
import { RequiredPermission } from 'src/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { ProductService } from 'src/products/products.service';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { User } from 'src/users/models/users.model';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameService } from './games.service';

@Resolver('Game')
export class GameResolver {
  constructor(
    private readonly gameService: GameService,
    private readonly storageService: StorageService,
    private readonly gameCategoryService: GameCategoryService,
    private readonly productService: ProductService,
    private readonly authGuard: AuthGuard,
  ) {}

  @Query()
  async games(
    @Context() ctx: any,
    @Context('req') req: Request,
    @Args('pageInfo') dto: PageInfoDto,
    @Args('search') search?: string,
    @Args('globalCategoryId') globalCategoryId?: number,
    @Args('type') type?: GameType,
    @Args('isFavourite') isFavourite?: boolean,
    @Args('order') order?: string,
    @Args('showHidden') showHidden: boolean = false,
    @Args('showWithoutGameCategories')
    showWithoutGameCategories: boolean = false,
  ) {
    ctx.showHidden = showHidden;

    return this.gameService.findAllWithPagination({
      dto,
      search,
      globalCategoryId,
      type,
      order,
      showHidden,
      showWithoutGameCategories,
      isFavourite,
      req,
    });
  }

  @Query()
  async adminGames(
    @Context() ctx: any,
    @Context('req') req: Request,
    @Args('pageInfo') dto: PageInfoDto,
    @Args('search') search?: string,
    @Args('globalCategoryId') globalCategoryId?: number,
    @Args('type') type?: GameType,
    @Args('isFavourite') isFavourite?: boolean,
    @Args('visible') visible?: boolean,
    @Args('haveChat') haveChat?: boolean,
    @Args('order') order?: string,
    @Args('showHidden') showHidden: boolean = false,
    @Args('showWithoutGameCategories')
    showWithoutGameCategories: boolean = false,
  ) {
    ctx.showHidden = showHidden;

    return this.gameService.findAllWithPagination({
      dto,
      search,
      globalCategoryId,
      type,
      order,
      showHidden,
      showWithoutGameCategories,
      isFavourite,
      visible,
      haveChat,
      req,
    });
  }

  @Query()
  async similarFourGames(@Args('id') id: number) {
    return await this.gameService.getSimilarFourGames(id);
  }

  @Query()
  async game(@Args('id') id: number) {
    const game = await this.gameService.findById(Number(id));
    if (!game) throw new BadRequestException(ErrorCause.NOT_FOUND);
    return game;
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('games.create')
  async createGame(@Args() dto: CreateGameDto) {
    return this.gameService.createGame(dto);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('games.update')
  async updateGame(@Args() dto: UpdateGameDto) {
    return this.gameService.updateGame(dto.id, dto);
  }

  @Mutation()
  @UseGuards(PermissionsGuard)
  @RequiredPermission('games.delete')
  async deleteGame(@Args('id') id: number) {
    return !!(await this.gameService.deleteGame(id));
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async addGameToFavourite(
    @Args('gameId') gameId: number,
    @CtxUser() user: User,
  ) {
    const countGf = await this.gameService.countGameFavouritesByUserId(user.id);
    if (countGf >= 50)
      throw new BadRequestException(
        ErrorCause.THE_LIMIT_OF_FAVOURITED_GAMES_HAS_BEEN_EXCEEDED,
      );
    return await this.gameService.addGameToFavourites(gameId, user.id);
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async removeGameFromFavourite(
    @Args('gameId') gameId: number,
    @CtxUser() user: User,
  ) {
    return await this.gameService.removeGameFromFavourites(gameId, user.id);
  }

  @ResolveField()
  async isFavourite(@Parent() game: Game, @Context('req') req: Request) {
    if (!req.headers.authorization) return false;

    try {
      const user = await this.authGuard.getUserByAuthHeader(
        req.headers.authorization,
      );

      return await this.gameService.checkGameInFavourites(
        Number(game.id),
        user.id,
      );
    } catch {
      return false;
    }
  }

  @ResolveField()
  async searches(@Parent() game: Game) {
    const searches = await this.gameService.getGameSearches(Number(game.id));

    return searches.map((el) => el.query);
  }

  @ResolveField()
  async icon(@Parent() game: Game) {
    if (!game?.iconKey) return null;
    const url = await this.storageService.getDownloadUrl(
      game?.iconKey,
      StorageBuckets.BannersAndIcons,
    );
    return url.split('?')[0];
  }

  @ResolveField()
  async banner(@Parent() game: Game) {
    if (!game?.bannerKey) return null;
    const url = await this.storageService.getDownloadUrl(
      game?.bannerKey,
      StorageBuckets.BannersAndIcons,
    );
    return url.split('?')[0];
  }

  @ResolveField()
  async name(@Parent() game: Game, @CtxLocale() locale: Locale) {
    const translation = await this.gameService.getGameTranslation(
      Number(game.id),
      locale,
    );
    return translation?.name;
  }
  @ResolveField()
  async description(@Parent() game: Game, @CtxLocale() locale: Locale) {
    const translation = await this.gameService.getGameTranslation(
      Number(game.id),
      locale,
    );
    return translation?.description;
  }

  @ResolveField()
  async translations(@Parent() game: Game) {
    return await this.gameService.getGameTranslations(Number(game.id));
  }

  @ResolveField()
  async countGameCategories(@Parent() game: Game) {
    return await this.gameCategoryService.countGameCategoriesByGameId(
      Number(game.id),
    );
  }

  @ResolveField()
  async gameCategories(
    @Parent() game: Game,
    @Context() ctx: any,
    @Args('orderGameCategories') orderGameCategories?: string,
    @Args('orderDirectionByProductsQuantity')
    orderDirectionByProductsQuantity?: OrderDirection,
  ) {
    return await this.gameCategoryService.getGameCategoriesByGameId(
      Number(game.id),
      orderGameCategories,
      orderDirectionByProductsQuantity,
      ctx.showHidden,
    );
  }

  @ResolveField()
  async countProducts(@Parent() game: Game) {
    return await this.productService.countProductsByGameId(Number(game.id));
  }
}
