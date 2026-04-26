import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { type Request } from 'express';
import { Op, Sequelize, UniqueConstraintError, WhereOptions } from 'sequelize';
import slug from 'slug';
import { AuthGuard } from 'src/auth/auth.guard';
import { ErrorCause } from 'src/errors-couse';
import { GameCategory } from 'src/game-categories/models/game-categories.model';
import { SuggestedGameCategory } from 'src/game-categories/models/suggested-game-categories.model';
import { IMAGE_MIME_TYPES } from 'src/global/constants/mime-types';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { parseOrderBy } from 'src/global/utils/parseOrderBy';
import { GameType, Locale } from 'src/graphql';
import { OrderProductSnapshot } from 'src/orders/models/order-product-snapshot.model';
import { Order } from 'src/orders/models/orders.model';
import { Product } from 'src/products/models/products.model';
import { Review } from 'src/reviews/reviews.model';
import { StorageBuckets } from 'src/storage/buckets.enum';
import { StorageService } from 'src/storage/storage.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameFavourite } from './models/game-favourites.model';
import { GameSearch } from './models/game-searches.model';
import { GameTranslation } from './models/game-translations.model';
import { Game } from './models/games.model';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game)
    private readonly gamesRepository: typeof Game,
    @InjectModel(GameTranslation)
    private readonly gameTranslationsRepository: typeof GameTranslation,
    @InjectConnection() private readonly sequalize: Sequelize,
    private readonly storageService: StorageService,
    @InjectModel(GameSearch)
    private readonly gameSearchRepository: typeof GameSearch,
    @InjectModel(GameFavourite)
    private readonly gameFavouriteRepository: typeof GameFavourite,
    private readonly authGuard: AuthGuard,
  ) {}

  async getAllByGlobalCategoryId(globalCategoryId: number) {
    return await this.gamesRepository.findAll({
      where: { visible: true },
      include: [
        {
          model: GameCategory,
          required: true,
          where: { globalCategoryId },
        },
      ],
    });
  }

  async getGamesWithOrders(userId: number, onlySales: boolean = false) {
    return await this.gamesRepository.findAll({
      where: { visible: true },
      include: [
        {
          model: GameCategory,
          required: true,
          include: [
            {
              model: Product,
              required: true,
              where: onlySales ? { sellerId: userId } : {},
              include: [
                {
                  model: OrderProductSnapshot,
                  required: true,
                  include: [
                    {
                      model: Order,
                      required: true,
                      where: !onlySales ? { buyerId: userId } : {},
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async getGamesWithProducts(sellerId?: number) {
    return await this.gamesRepository.findAll({
      include: {
        model: GameCategory,
        required: true,
        where: { visible: true },
        include: [
          {
            model: Product,
            required: true,
            where: { active: true, ...(sellerId ? { sellerId } : {}) },
          },
        ],
      },
    });
  }

  async getGameTranslation(id: number, locale: Locale) {
    return this.gameTranslationsRepository.findOne({
      where: { gameId: id, locale },
    });
  }
  async getGamesWithSuggestedGameCategories() {
    return await this.gamesRepository.findAll({
      include: { model: SuggestedGameCategory, required: true },
    });
  }

  async getGameTranslations(id: number) {
    return this.gameTranslationsRepository.findAll({
      where: { gameId: id },
    });
  }

  async getGamesWithReviews(filters?: {
    sellerId?: number;
    productId?: number;
  }) {
    return await this.gamesRepository.findAll({
      where: { visible: true },
      include: [
        {
          model: GameCategory,
          where: { visible: true },
          include: [
            {
              model: Product,
              paranoid: false,
              where: {
                active: true,
                ...(filters?.sellerId ? { sellerId: filters.sellerId } : {}),
              },
              include: [
                {
                  model: Review,
                  required: true,
                  where: {
                    ...(filters?.productId
                      ? { productId: filters.productId }
                      : {}),
                  },
                },
              ],
              required: true,
            },
          ],
          required: true,
        },
      ],
    });
  }

  async countGameFavouritesByUserId(userId: number) {
    return await this.gameFavouriteRepository.count({ where: { userId } });
  }

  async checkGameInFavourites(gameId: number, userId: number) {
    try {
      const pf = await this.gameFavouriteRepository.findOne({
        where: { gameId, userId },
      });
      return Boolean(pf);
    } catch {
      return false;
    }
  }

  async addGameToFavourites(gameId: number, userId: number) {
    try {
      const gf = await this.gameFavouriteRepository.create({
        gameId,
        userId,
      });
      return Boolean(gf);
    } catch (e) {
      if (e instanceof UniqueConstraintError)
        throw new BadRequestException(ErrorCause.GAME_ALREADY_FAVOURITED);
      throw e;
    }
  }

  async removeGameFromFavourites(gameId: number, userId: number) {
    const gf = await this.gameFavouriteRepository.findOne({
      where: { gameId, userId },
    });
    await gf?.destroy();
    return true;
  }

  async getSimilarFourGames(gameId: number) {
    const game = await this.findById(gameId);

    return this.gamesRepository.findAll({
      where: {
        id: {
          [Op.ne]: gameId,
        },
        type: game!.type,
      },
      limit: 4,
    });
  }

  async getTranslationsBySearch(search: string) {
    return this.gameTranslationsRepository.findAll({
      where: {
        [Op.or]: {
          name: { [Op.iLike]: `%${search}%` },
          description: { [Op.iLike]: `%${search}%` },
        },
      },
    });
  }

  async findAllWithPagination({
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
  }: {
    dto: PageInfoDto;
    search?: string;
    globalCategoryId?: number;
    type?: GameType;
    order?: string;
    showHidden?: boolean;
    showWithoutGameCategories?: boolean;
    isFavourite?: boolean;
    visible?: boolean;
    haveChat?: boolean;
    req?: Request;
  }) {
    const { limit = 20, page = 1 } = dto;
    const offset = (page - 1) * limit;

    const favouriteIds: number[] = [];

    if (isFavourite && req) {
      if (req.headers.authorization) {
        try {
          const user = await this.authGuard.getUserByAuthHeader(
            req.headers.authorization,
          );

          const pf = await this.gameFavouriteRepository.findAll({
            where: { userId: user.id },
          });

          favouriteIds.push(...pf.map((f) => f.gameId));
        } catch {}
      }
    }

    let gameIds: number[] = [];

    if (search) {
      const searches = await this.getSearchesByQuery(search);
      gameIds = searches.map((el) => el.gameId);

      const translations = await this.getTranslationsBySearch(search);
      gameIds = [...gameIds, ...translations.map((el) => el.gameId)];
    }

    const where: WhereOptions<Game> = {
      ...(search ? { id: { [Op.in]: gameIds } } : {}),
      ...(type ? { type } : {}),
    };

    if (isFavourite && Array.isArray(where?.id?.[Op.in])) {
      where.id = {
        [Op.in]: favouriteIds.filter((el) => where.id[Op.in].includes(el)),
      };
    }
    if (isFavourite && !Array.isArray(where?.id?.[Op.in])) {
      where.id = {
        [Op.in]: favouriteIds,
      };
    }

    where.visible = { [Op.eq]: true };
    if (showHidden) delete where.visible;

    if (typeof visible === 'boolean') {
      where.visible = { [Op.eq]: visible };
    }

    if (typeof haveChat === 'boolean') {
      where.haveChat = { [Op.eq]: haveChat };
    }

    const gameCategoryWhere = {
      ...(globalCategoryId ? { globalCategoryId, visible: true } : {}),
      visible: true,
    };

    const include = [
      ...(globalCategoryId || !showWithoutGameCategories
        ? [
            {
              model: GameCategory,
              required: true,
              where: gameCategoryWhere,
            },
          ]
        : []),
    ];

    const { count, rows } = await this.gamesRepository.findAndCountAll({
      limit,
      offset,
      distinct: true,
      where,
      include,
      order: order ? [parseOrderBy(order)] : [['createdAt', 'DESC']],
    });

    const counters = await this.gamesRepository.findAll({
      attributes: [
        'type',
        [Sequelize.fn('COUNT', Sequelize.col('type')), 'count'],
      ],
      group: ['type'],
      raw: true,
    });

    const counts: any = {};
    counters.forEach((el: any) => {
      counts[el.type] = Number(el.count);
    });

    return {
      count,
      pages: Math.ceil(count / limit),
      gameCount: counts[GameType.game],
      mobileGameCount: counts[GameType.mobile_game],
      applicationCount: counts[GameType.application],
      rows,
    };
  }

  async findById(id: number) {
    return await this.gamesRepository.findByPk(id);
  }

  async findBySlug(slug: string) {
    return this.gamesRepository.findOne({
      where: { slug },
    });
  }

  async findGamesBySellerId(sellerId: number) {
    return await this.gamesRepository.findAll({
      include: [
        {
          model: GameCategory,
          required: true,
          include: {
            // @ts-ignore
            model: Product,
            required: true,
            where: { sellerId },
          },
        },
      ],
    });
  }

  async createGame(dto: CreateGameDto) {
    const sl = slug(dto.translations[0].name!);

    let iconFile: string | undefined = undefined;
    let bannerFile: string | undefined = undefined;
    if (dto.iconKey) {
      const fileExists = await this.storageService.fileExists(
        dto.iconKey,
        StorageBuckets.BannersAndIcons,
      );
      if (!fileExists) throw new NotFoundException(ErrorCause.FILE_NOT_FOUND);
      const isImage = await this.storageService.checkFileMimeType(
        dto.iconKey,
        IMAGE_MIME_TYPES,
        StorageBuckets.BannersAndIcons,
      );
      if (!isImage)
        throw new BadRequestException(ErrorCause.FILE_INCORRECT_MIME_TYPE);

      iconFile = dto.iconKey;
    }
    if (dto.bannerKey) {
      const fileExists = await this.storageService.fileExists(
        dto.bannerKey,
        StorageBuckets.BannersAndIcons,
      );
      if (!fileExists) throw new NotFoundException(ErrorCause.FILE_NOT_FOUND);
      const isImage = await this.storageService.checkFileMimeType(
        dto.bannerKey,
        IMAGE_MIME_TYPES,
        StorageBuckets.BannersAndIcons,
      );
      if (!isImage)
        throw new BadRequestException(ErrorCause.FILE_INCORRECT_MIME_TYPE);

      bannerFile = dto.bannerKey;
    }

    const game = await this.gamesRepository.create(
      {
        slug: sl,
        visible: dto.visible ?? true,
        type: dto.type,
        translations: dto.translations,
        iconKey: iconFile,
        bannerKey: bannerFile,
        hideMainSection: dto.hideMainSection ?? false,
        haveChat: dto.haveChat ?? false,
      },
      { include: [GameTranslation] },
    );

    if (dto.searches)
      await this.gameSearchRepository.bulkCreate(
        dto.searches.map((el) => ({ gameId: game.id, query: el })),
      );

    return game;
  }

  async updateGame(id: number, dto: UpdateGameDto) {
    const game = await this.findById(id);

    if (dto.searches) {
      await this.gameSearchRepository.destroy({ where: { gameId: game!.id } });

      await this.gameSearchRepository.bulkCreate(
        dto.searches.map((el) => ({ gameId: game!.id, query: el })),
      );
    }

    if (typeof dto.bannerKey !== 'undefined') {
      await this.gamesRepository.update({ bannerKey: null }, { where: { id } });
      if (dto.bannerKey) {
        const fileExists = await this.storageService.fileExists(
          dto.bannerKey,
          StorageBuckets.BannersAndIcons,
        );
        if (!fileExists) throw new NotFoundException(ErrorCause.FILE_NOT_FOUND);
        const isImage = await this.storageService.checkFileMimeType(
          dto.bannerKey,
          IMAGE_MIME_TYPES,
          StorageBuckets.BannersAndIcons,
        );
        if (!isImage)
          throw new BadRequestException(ErrorCause.FILE_INCORRECT_MIME_TYPE);

        if (game?.bannerKey)
          await this.storageService.deleteFile(
            game?.bannerKey,
            StorageBuckets.BannersAndIcons,
          );

        await this.gamesRepository.update(
          { bannerKey: dto.bannerKey },
          { where: { id } },
        );
      }
    }

    if (typeof dto.iconKey !== 'undefined') {
      await this.gamesRepository.update({ iconKey: null }, { where: { id } });
      if (dto.iconKey) {
        const fileExists = await this.storageService.fileExists(
          dto.iconKey,
          StorageBuckets.BannersAndIcons,
        );
        if (!fileExists) throw new NotFoundException(ErrorCause.FILE_NOT_FOUND);
        const isImage = await this.storageService.checkFileMimeType(
          dto.iconKey,
          IMAGE_MIME_TYPES,
          StorageBuckets.BannersAndIcons,
        );
        if (!isImage)
          throw new BadRequestException(ErrorCause.FILE_INCORRECT_MIME_TYPE);

        if (game?.iconKey)
          await this.storageService.deleteFile(
            game?.iconKey,
            StorageBuckets.BannersAndIcons,
          );

        await this.gamesRepository.update(
          { iconKey: dto.iconKey },
          { where: { id } },
        );
      }
    }

    return await this.sequalize.transaction(async (transaction) => {
      if (typeof dto.visible === 'boolean') {
        await this.gamesRepository.update(
          { visible: dto.visible },
          { where: { id }, transaction },
        );
      }

      await this.gamesRepository.update(
        {
          type: dto.type,
          hideMainSection: dto.hideMainSection,
          haveChat: dto.haveChat,
        },
        { where: { id }, transaction },
      );

      if (dto.translations?.length) {
        const sl = slug(dto.translations[0].name!);
        try {
          const gameBySlug = await this.findBySlug(sl);
          if (gameBySlug && Number(gameBySlug.id) !== Number(id))
            throw new BadRequestException(ErrorCause.ALREADY_EXISTS);
        } catch {}

        await this.gamesRepository.update(
          { slug: sl },
          { where: { id }, transaction },
        );

        await GameTranslation.destroy({
          where: { gameId: id },
          transaction,
        });

        await GameTranslation.bulkCreate(
          dto.translations.map((t) => ({ ...t, gameId: id })),
          { transaction },
        );
      }

      return game?.reload({ transaction });
    });
  }

  async getSearchesByQuery(query: string) {
    return await this.gameSearchRepository.findAll({
      where: { query: { [Op.iLike]: `%${query}%` } },
    });
  }

  async getGameSearches(gameId: number) {
    return await this.gameSearchRepository.findAll({ where: { gameId } });
  }

  async deleteGame(id: number) {
    return await this.sequalize.transaction(async (transaction) => {
      const game = await this.findById(id);
      await game?.destroy();
      return true;
    });
  }
}
