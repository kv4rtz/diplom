import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthGuard } from 'src/auth/auth.guard';
import { CtxUser } from 'src/auth/ctx-user.decorator';
import { GameService } from 'src/games/games.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { User } from 'src/users/models/users.model';
import { UsersService } from 'src/users/users.service';
import { SuggestedGameCategoryStatus } from './../graphql';
import { SuggestedGameCategoryCreateDto } from './dto/suggested-game-category-create.dto';
import { GameCategoryService } from './game-categories.service';
import { SuggestedGameCategory } from './models/suggested-game-categories.model';

@Resolver('SuggestedGameCategory')
export class SuggestedGameCategoryResolver {
  constructor(
    private readonly gameCategoriesService: GameCategoryService,
    private readonly usersService: UsersService,
    private readonly gamesService: GameService,
  ) {}

  @Query()
  async suggestedGameCategories(
    @Args('pageInfo') pageInfo: PageInfoDto,
    @Args('search') search?: string,
    @Args('gameId') gameId?: number,
    @Args('status') status?: SuggestedGameCategoryStatus,
    @Args('order') order?: string,
  ) {
    return await this.gameCategoriesService.findAllSuggestedWithPagination({
      pageInfo,
      status,
      search,
      gameId,
      order,
    });
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async createSuggestedGameCategory(
    @Args() dto: SuggestedGameCategoryCreateDto,
    @CtxUser() user: User,
  ) {
    return await this.gameCategoriesService.createSuggestedGameCategory({
      ...dto,
      userId: user.id,
    });
  }

  @Mutation()
  @UseGuards(AuthGuard)
  async approveSuggestedGameCategory(@Args('id') id: number) {
    return await this.gameCategoriesService.changeSuggestedGameCategoryStatus(
      id,
      SuggestedGameCategoryStatus.APPROVED,
    );
  }
  @Mutation()
  @UseGuards(AuthGuard)
  async rejectSuggestedGameCategory(@Args('id') id: number) {
    return await this.gameCategoriesService.changeSuggestedGameCategoryStatus(
      id,
      SuggestedGameCategoryStatus.REJECTED,
    );
  }

  @ResolveField()
  async user(@Parent() suggestedGameCategory: SuggestedGameCategory) {
    return await this.usersService.getUserById(suggestedGameCategory.userId);
  }

  @ResolveField()
  async game(@Parent() suggestedGameCategory: SuggestedGameCategory) {
    return await this.gamesService.findById(suggestedGameCategory.gameId);
  }
}
