import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Order, Sequelize, Transaction, WhereOptions } from 'sequelize';
import slug from 'slug';
import { GameService } from 'src/games/games.service';
import { GlobalCategoriesService } from 'src/global-categories/global-categories.service';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { parseOrderBy } from 'src/global/utils/parseOrderBy';
import {
  Locale,
  OrderDirection,
  SuggestedGameCategoryStatus,
} from 'src/graphql';
import { Product } from 'src/products/models/products.model';
import { Review } from 'src/reviews/reviews.model';
import { AddGameCategoryOptionDto } from './dto/add-game-category-option.dto';
import { CreateGameCategoryDto } from './dto/create-game-category.dto';
import { UpdateGameCategoryOptionDto } from './dto/update-game-category-option.dto';
import { UpdateGameCategoryDto } from './dto/update-game-category.dto';
import { GameCategoryOptionTranslation } from './models/game-categories-options-translations.model';
import { GameCategoryOptionValueTranslation } from './models/game-categories-options-values-translations.model';
import { GameCategoryOptionValue } from './models/game-categories-options-values.model';
import { GameCategoryOption } from './models/game-categories-options.model';
import { GameCategoryTranslation } from './models/game-categories-translations.model';
import { GameCategory } from './models/game-categories.model';
import {
  SuggestedGameCategory,
  type SuggestedGameCategoryCreationAttrs,
} from './models/suggested-game-categories.model';

@Injectable()
export class GameCategoryService {
  constructor(
    @InjectModel(GameCategory)
    private readonly gameCategoryRepository: typeof GameCategory,
    @InjectModel(GameCategoryTranslation)
    private readonly gameCategoryTranslationRepository: typeof GameCategoryTranslation,
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(GameCategoryOption)
    private readonly gameCategoryOptionRepository: typeof GameCategoryOption,
    @InjectModel(GameCategoryOptionTranslation)
    private readonly gameCategoryOptionTranslationRepository: typeof GameCategoryOptionTranslation,
    @InjectModel(GameCategoryOptionValue)
    private readonly gameCategoryOptionValueRepository: typeof GameCategoryOptionValue,
    @InjectModel(GameCategoryOptionValueTranslation)
    private readonly gameCategoryOptionValueTranslationRepository: typeof GameCategoryOptionValueTranslation,
    @InjectModel(SuggestedGameCategory)
    private readonly suggestedGameCategoryRepostiory: typeof SuggestedGameCategory,
    private readonly gamesService: GameService,
    private readonly globalCategoriesService: GlobalCategoriesService,
  ) {}

  async getGameCategoriesWithProducts(sellerId?: number) {
    return await this.gameCategoryRepository.findAll({
      where: { visible: true },
      include: {
        model: Product,
        required: true,
        where: { active: true, ...(sellerId ? { sellerId } : {}) },
      },
    });
  }

  async getGameCategoriesWithReviews(filters?: {
    sellerId?: number;
    productId?: number;
  }) {
    return await this.gameCategoryRepository.findAll({
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
                ...(filters?.productId ? { productId: filters.productId } : {}),
              },
            },
          ],
          required: true,
        },
      ],
    });
  }

  async changeSuggestedGameCategoryStatus(
    id: number,
    status: SuggestedGameCategoryStatus,
  ) {
    const sgc = await this.suggestedGameCategoryRepostiory.findByPk(id);
    await sgc?.update({ status });
    return await sgc?.reload();
  }

  async findAllSuggestedWithPagination(params: {
    pageInfo: PageInfoDto;
    search?: string;
    status?: string;
    gameId?: number;
    order?: string;
  }) {
    const { page = 1, limit = 20 } = params.pageInfo;

    const offset = (page - 1) * limit;

    let where: WhereOptions<SuggestedGameCategory> = {
      ...(params.search ? { name: { [Op.iLike]: `%${params.search}%` } } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.gameId ? { gameId: params.gameId } : {}),
    };

    const { rows, count } =
      await this.suggestedGameCategoryRepostiory.findAndCountAll({
        limit,
        offset,
        distinct: true,
        order: params.order
          ? [parseOrderBy(params.order)]
          : [['createdAt', 'DESC']],
        where,
      });

    return {
      rows,
      count,
      games: this.gamesService.getGamesWithSuggestedGameCategories(),
      pages: Math.ceil(count / limit),
    };
  }

  async createSuggestedGameCategory(
    creationAttrs: SuggestedGameCategoryCreationAttrs,
  ) {
    return await this.suggestedGameCategoryRepostiory.create(creationAttrs);
  }

  async updateGameCategoryOption(id: number, dto: UpdateGameCategoryOptionDto) {
    const option = await this.gameCategoryOptionRepository.findByPk(id);

    await option?.update({
      type: dto.type,
      rangeMin: dto.rangeMin,
      rangeMax: dto.rangeMax,
      isRequired: dto.isRequired,
    });

    if (dto.values) {
      await this.gameCategoryOptionValueRepository.destroy({
        where: { gameCategoryOptionId: id },
      });

      for await (const value of dto.values) {
        await this.gameCategoryOptionValueRepository.create(
          {
            gameCategoryOptionId: id,
            translations: value.translations,
          },
          { include: [GameCategoryOptionValueTranslation] },
        );
      }
    }

    if (dto.translations) {
      await this.gameCategoryOptionTranslationRepository.destroy({
        where: { gameCategoryOptionId: id },
      });

      for await (const translation of dto.translations) {
        await this.gameCategoryOptionTranslationRepository.create({
          gameCategoryOptionId: id,
          ...translation,
        });
      }
    }

    return await option?.reload();
  }

  async findGameCategoriesBySellerId(sellerId: number) {
    return await this.gameCategoryRepository.findAll({
      include: {
        model: Product,
        where: { sellerId },
      },
    });
  }

  async addGameCategoryOption(dto: AddGameCategoryOptionDto) {
    const option = await this.gameCategoryOptionRepository.create(
      {
        type: dto.type,
        rangeMin: dto.rangeMin,
        rangeMax: dto.rangeMax,
        isRequired: dto.isRequired,
        gameCategoryId: dto.gameCategoryId,
        translations: dto.translations,
      },
      { include: [GameCategoryOptionTranslation] },
    );

    if (dto.values) {
      for await (const value of dto.values) {
        await this.gameCategoryOptionValueRepository.create(
          {
            gameCategoryOptionId: option.id,
            translations: value.translations,
          },
          { include: [GameCategoryOptionValueTranslation] },
        );
      }
    }

    return option;
  }

  async deleteGameCategoryOption(id: number) {
    const option = await this.gameCategoryOptionRepository.findByPk(id);
    await option?.destroy();
    return true;
  }

  async getGameCategoriesByGameId(
    id: number,
    orderGameCategories?: string,
    orderDirectionByProductsQuantity?: OrderDirection,
    showHidden?: boolean,
  ) {
    const where: WhereOptions<GameCategory> = {};
    where.visible = { [Op.eq]: true };
    if (showHidden) delete where.visible;
    where.gameId = id;

    const order: Order = [];

    if (orderGameCategories) {
      order.push(parseOrderBy(orderGameCategories));
    }

    if (orderDirectionByProductsQuantity) {
      order.push(['productsCount', orderDirectionByProductsQuantity]);
    }

    return await this.gameCategoryRepository.findAll({
      where,
      attributes: {
        include: [
          [
            Sequelize.fn('COUNT', Sequelize.col('products.id')),
            'productsCount',
          ],
        ],
      },
      include: [
        {
          model: Product,
          attributes: [],
        },
      ],
      group: ['GameCategory.id'],
      order,
    });
  }

  async countGameCategoriesByGameId(id: number) {
    return await this.gameCategoryRepository.count({
      where: { gameId: id, visible: true },
    });
  }

  async countGameCategoriesByGlobalCategoryId(id: number) {
    return await this.gameCategoryRepository.count({
      where: { globalCategoryId: id },
    });
  }

  async getGameCategoryTranslation(id: number, locale: Locale) {
    return await this.gameCategoryTranslationRepository.findOne({
      where: { gameCategoryId: id, locale },
    });
  }

  async getGameCategoryTranslations(id: number) {
    return await this.gameCategoryTranslationRepository.findAll({
      where: { gameCategoryId: id },
    });
  }

  async getGameCategoryOptionTranslation(id: number, locale: Locale) {
    return await this.gameCategoryOptionTranslationRepository.findOne({
      where: { gameCategoryOptionId: id, locale },
    });
  }

  async getGameCategoryOptionTranslations(id: number) {
    return await this.gameCategoryOptionTranslationRepository.findAll({
      where: { gameCategoryOptionId: id },
    });
  }

  async getGameCategoryOptionValuesByOptionId(id: number) {
    return await this.gameCategoryOptionValueRepository.findAll({
      where: { gameCategoryOptionId: id },
    });
  }

  async getGameCategoryOptionValueTranslation(id: number, locale: Locale) {
    return await this.gameCategoryOptionValueTranslationRepository.findOne({
      where: { gameCategoryOptionValueId: id, locale },
    });
  }

  async getGameCategoryOptionValueTranslations(id: number) {
    return await this.gameCategoryOptionValueTranslationRepository.findAll({
      where: { gameCategoryOptionValueId: id },
    });
  }

  async getGameCategoryOptions(id: number) {
    return await this.gameCategoryOptionRepository.findAll({
      where: { gameCategoryId: id },
      order: [['id', 'ASC']],
    });
  }

  async getGameCategoryOptionsById(id: number) {
    return await this.gameCategoryOptionRepository.findByPk(id);
  }

  async getGameCategoryOptionValueTranslationsById(id: number, locale: Locale) {
    return await this.gameCategoryOptionValueTranslationRepository.findOne({
      where: { gameCategoryOptionValueId: id, locale },
    });
  }

  async getGameCategoryOptionById(id: number) {
    return await this.gameCategoryOptionRepository.findByPk(id);
  }

  async getGameCategoriesTranslationsBySearch(search: string) {
    return await this.gameCategoryTranslationRepository.findAll({
      where: { label: { [Op.iLike]: `%${search}%` } },
    });
  }

  async findAllWithPagination(
    dto: PageInfoDto,
    order: string,
    search?: string,
    gameId?: number,
    showHidden?: boolean,
    globalCategoryId?: number,
    visible?: boolean,
    allowScreenshotsInProduct?: boolean,
    sellerVerifiedPhone?: boolean,
    sellerVerfiedIdentity?: boolean,
  ) {
    const { page = 1, limit = 20 } = dto;

    const offset = (page - 1) * limit;

    let where: WhereOptions<GameCategory> = {};

    if (search) {
      const translations =
        await this.getGameCategoriesTranslationsBySearch(search);
      where.id = {
        [Op.in]: translations.map((t) => t.gameCategoryId),
      };
    }

    if (gameId) {
      where.gameId = gameId;
    }

    where.visible = { [Op.eq]: true };
    if (showHidden) delete where.visible;

    if (typeof visible === 'boolean') where.visible = { [Op.eq]: visible };
    if (typeof allowScreenshotsInProduct === 'boolean')
      where.allowScreenshotsInProduct = { [Op.eq]: allowScreenshotsInProduct };
    if (typeof sellerVerifiedPhone === 'boolean')
      where.sellerVerifiedPhone = { [Op.eq]: sellerVerifiedPhone };
    if (typeof sellerVerfiedIdentity === 'boolean')
      where.sellerVerfiedIdentity = { [Op.eq]: sellerVerfiedIdentity };
    if (typeof globalCategoryId === 'number')
      where.globalCategoryId = { [Op.eq]: globalCategoryId };

    const { rows, count } = await this.gameCategoryRepository.findAndCountAll({
      limit,
      offset,
      distinct: true,
      order: order ? [parseOrderBy(order)] : [['createdAt', 'DESC']],
      where,
    });

    return {
      rows,
      count,
      globalCategories:
        await this.globalCategoriesService.getGlobalCategoriesWithGameCategories(),
      pages: Math.ceil(count / limit),
    };
  }

  async findById(id: number, transaction?: Transaction) {
    return await this.gameCategoryRepository.findByPk(id, { transaction });
  }

  async createGameCategory(dto: CreateGameCategoryDto) {
    return await this.sequelize.transaction(async (transaction) => {
      const gameCategory = await this.gameCategoryRepository.create(
        {
          ...dto,
          slug: slug(dto.translations[0].label),
          translations: dto.translations,
        },
        { transaction, include: [GameCategoryTranslation] },
      );

      for await (const option of dto.options) {
        const createdOption = await this.gameCategoryOptionRepository.create(
          {
            type: option.type,
            rangeMin: option.rangeMin,
            rangeMax: option.rangeMax,
            gameCategoryId: gameCategory.id,
            translations: option.translations,
            isRequired: option.isRequired,
          },
          { transaction, include: [GameCategoryOptionTranslation] },
        );

        if (option.values) {
          for await (const optionValue of option.values) {
            await this.gameCategoryOptionValueRepository.create(
              {
                translations: optionValue.translations,
                gameCategoryOptionId: createdOption.id,
              },
              { transaction, include: [GameCategoryOptionValueTranslation] },
            );
          }
        }
      }

      return await gameCategory.reload({
        transaction,
      });
    });
  }

  async updateGameCategory(id: number, dto: UpdateGameCategoryDto) {
    return await this.sequelize.transaction(async (transaction) => {
      const gameCategory = await this.gameCategoryRepository.findByPk(id, {
        transaction,
        include: [GameCategoryTranslation, GameCategoryOption],
      });

      await gameCategory?.update(
        {
          visible: dto.visible,
          gameId: dto.gameId,
          globalCategoryId: dto.globalCategoryId,
          productsQuantityByUser: dto.productsQuantityByUser,
          minOrderPrice: dto.minOrderPrice,
          possiblePercentage: dto.possiblePercentage,
          commentForBuyer: dto.commentForBuyer,
          allowScreenshotsInProduct: dto.allowScreenshotsInProduct,
          sellerVerifiedPhone: dto.sellerVerifiedPhone,
          sellerVerfiedIdentity: dto.sellerVerfiedIdentity,
          discountForBalancePayment: dto.discountForBalancePayment,
          slug: dto.translations?.[0].label
            ? slug(dto.translations[0].label)
            : undefined,
        },
        { transaction },
      );

      if (dto.translations) {
        gameCategory?.translations.forEach(async (translation) => {
          await translation.destroy({ transaction });
        });

        await this.gameCategoryTranslationRepository.bulkCreate(
          dto.translations.map((translation) => ({
            locale: translation.locale,
            label: translation.label,
            gameCategoryId: gameCategory?.id,
          })),
          { transaction },
        );
      }

      return await gameCategory?.reload({
        transaction,
      });
    });
  }

  async deleteGameCategory(id: number) {
    const gameCategory = await this.gameCategoryRepository.findByPk(id);

    await gameCategory?.destroy();

    return true;
  }
}
