import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Order, Sequelize, WhereOptions } from 'sequelize';
import slug from 'slug';
import { ErrorCause } from 'src/errors-couse';
import { GameCategory } from 'src/game-categories/models/game-categories.model';
import { PageInfoDto } from 'src/global/dto/page-info.dto';
import { parseOrderBy } from 'src/global/utils/parseOrderBy';
import { GlobalCategoryType, Locale } from 'src/graphql';
import { CreateGlobalCategoryDto } from './dto/create-global-category.dto';
import { UpdateGlobalCategoryDto } from './dto/update-global-category.dto';
import { GlobalCategoryTranslation } from './models/global-categories-translations.model';
import { GlobalCategory } from './models/global-categories.model';

@Injectable()
export class GlobalCategoriesService {
  constructor(
    @InjectModel(GlobalCategory)
    private readonly globalCategoriesRepository: typeof GlobalCategory,
    @InjectModel(GlobalCategoryTranslation)
    private readonly globalCategoriesTranslationsRepository: typeof GlobalCategoryTranslation,
    @InjectConnection() private readonly sequalize: Sequelize,
  ) {}

  async getGlobalCaregoryTranslation(id: number, locale: Locale) {
    return await this.globalCategoriesTranslationsRepository.findOne({
      where: { globalCategoryId: id, locale },
    });
  }

  async getGlobalCategoriesWithGameCategories() {
    return await this.globalCategoriesRepository.findAll({
      include: {
        model: GameCategory,
      },
    });
  }

  async getGlobalCaregoryTranslations(id: number) {
    return await this.globalCategoriesTranslationsRepository.findAll({
      where: { globalCategoryId: id },
    });
  }

  async getGlobalCategoryTranslationsBySearch(search: string) {
    return await this.globalCategoriesTranslationsRepository.findAll({
      where: { name: { [Op.iLike]: `%${search}%` } },
    });
  }

  async findAllWithPagination(
    dto: PageInfoDto,
    order?: string,
    search?: string,
    showHidden?: boolean,
    type?: GlobalCategoryType,
  ) {
    const { limit = 20, page = 1 } = dto;
    const offset = (page - 1) * limit;

    let where: WhereOptions<GlobalCategory> = {};

    if (search) {
      const translations =
        await this.getGlobalCategoryTranslationsBySearch(search);
      where.id = { [Op.in]: translations.map((el) => el.globalCategoryId) };
    }

    where.visible = { [Op.eq]: true };
    if (showHidden) delete where.visible;

    if (type) where.type = type;

    const orderBy: Order = [];
    if (order) orderBy.push(parseOrderBy(order));
    else orderBy.push(['slug', 'ASC']);

    const { count, rows } =
      await this.globalCategoriesRepository.findAndCountAll({
        limit,
        offset,
        distinct: true,
        order: orderBy,
        where,
      });

    return {
      count,
      pages: Math.ceil(count / limit),
      rows,
    };
  }

  async findBySlug(slug: string) {
    return await this.globalCategoriesRepository.findOne({
      where: { slug },
    });
  }

  async findById(id: number) {
    return await this.globalCategoriesRepository.findByPk(id);
  }

  async createGlobalCategory(dto: CreateGlobalCategoryDto) {
    const sl = slug(dto.translations[0].name!);

    return await this.globalCategoriesRepository.create(
      {
        slug: sl,
        visible: dto.visible ?? true,
        translations: dto.translations,
        type: dto.type,
      },
      { include: [GlobalCategoryTranslation] },
    );
  }

  async updateGlobalCategory(id: number, dto: UpdateGlobalCategoryDto) {
    const globalCategory = await this.findById(id);

    return this.sequalize.transaction(async (transaction) => {
      await this.globalCategoriesRepository.update(
        { type: dto.type },
        { where: { id }, transaction },
      );
      if (typeof dto.visible === 'boolean') {
        await this.globalCategoriesRepository.update(
          { visible: dto.visible },
          { where: { id }, transaction },
        );
      }

      if (dto.translations?.length) {
        if (dto.translations) {
          const sl = slug(dto.translations[0].name!);

          await this.globalCategoriesRepository.update(
            { slug: sl },
            { where: { id }, transaction },
          );

          await GlobalCategoryTranslation.destroy({
            where: { globalCategoryId: id },
            transaction,
          });

          await GlobalCategoryTranslation.bulkCreate(
            dto.translations.map((t) => ({ ...t, globalCategoryId: id })),
            { transaction },
          );
        }
      }

      return globalCategory?.reload({
        transaction,
      });
    });
  }

  async deleteGlobalCategory(id: number) {
    const globalCategory = await this.findById(id);
    if (!globalCategory) throw new BadRequestException(ErrorCause.NOT_FOUND);

    return this.sequalize.transaction(async (transaction) => {
      await GlobalCategoryTranslation.destroy({
        where: { globalCategoryId: id },
        transaction,
      });
      return await this.globalCategoriesRepository.destroy({
        where: { id },
        transaction,
      });
    });
  }
}
