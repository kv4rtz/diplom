import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import {
  IncludeOptions,
  Op,
  QueryTypes,
  Sequelize,
  WhereOptions,
} from 'sequelize';
import { ErrorCause } from 'src/errors-couse';
import { GameCategoryService } from 'src/game-categories/game-categories.service';
import { GameCategory } from 'src/game-categories/models/game-categories.model';
import { GameService } from 'src/games/games.service';
import { parseOrderBy } from 'src/global/utils/parseOrderBy';
import { PageInfo, Ratings, ReviewType } from 'src/graphql';
import { Order } from 'src/orders/models/orders.model';
import { OrdersService } from 'src/orders/orders.service';
import { Product } from 'src/products/models/products.model';
import { ProductService } from 'src/products/products.service';
import { User } from 'src/users/models/users.model';
import {
  CreateReviewAnswerDto,
  CreateReviewDto,
} from './dto/create-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import {
  UpdateReviewAnswerDto,
  UpdateReviewDto,
} from './dto/update-review.dto';
import { Review } from './reviews.model';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review) private readonly reviewsRepository: typeof Review,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly gameService: GameService,
    private readonly gameCategoryService: GameCategoryService,
    @InjectConnection() private readonly connection: Sequelize,
  ) {}

  async getAllReviewsWithPagination(pageInfo: PageInfo, dto: GetReviewsDto) {
    const { limit = 20, page = 1 } = pageInfo;
    const offset = (page - 1) * limit;

    let sId = dto.sellerId!;
    if (!dto.sellerId && dto.productId) {
      const product = await this.productService.findById(dto.productId);
      sId = product!.sellerId;
    }

    const where: WhereOptions<Review> = {
      ...(dto.productId ? { productId: dto.productId } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.score
        ? {
            [Op.and]: Sequelize.where(
              Sequelize.literal(`
        (
          "speedRating" + 
          "qualityRating" + 
          "accordanceRating" + 
          "communicationRating" + 
          "recommendationRating" + 
          "generalRating"
        ) / 6.0
      `),
              'BETWEEN',
              [dto.score, dto.score + 0.999999999],
            ),
          }
        : {}),
    };

    const include: IncludeOptions[] = [];
    if (dto.sellerId || dto.gameCategoryId || dto.gameId) {
      const productWhere: WhereOptions<Product> = {};
      if (dto.sellerId) productWhere.sellerId = dto.sellerId;
      if (dto.gameCategoryId) productWhere.gameCategoryId = dto.gameCategoryId;
      const gameCategoryWhere: WhereOptions<GameCategory> = {};
      if (dto.gameId) gameCategoryWhere.gameId = dto.gameId;

      include.push({
        model: Product,
        required: true,
        where: productWhere,
        paranoid: false,
        include: [
          {
            model: GameCategory,
            required: true,
            where: gameCategoryWhere,
          },
        ],
      });
    }

    const { count, rows } = await this.reviewsRepository.findAndCountAll({
      limit,
      offset,
      where,
      include,
      distinct: true,
      order: [dto.order ? parseOrderBy(dto.order) : ['createdAt', 'DESC']],
    });

    const games = await this.gameService.getGamesWithReviews({
      sellerId: sId,
      productId: dto.productId,
    });
    const gameCategories =
      await this.gameCategoryService.getGameCategoriesWithReviews({
        sellerId: sId,
        productId: dto.productId,
      });

    const ratings = await this.getRatingsSummary(sId);

    return {
      count,
      ratings,
      games,
      gameCategories,
      pages: Math.ceil(count / limit),
      rows,
    };
  }

  async hasConsecutiveBadReviewsForSeller(
    sellerId: number,
    threshold: number = 7,
  ): Promise<boolean> {
    const result = await this.connection.query<{
      hasConsecutive: boolean;
    }>(
      `WITH seller_reviews AS (
      SELECT 
        r.id,
        r."createdAt",
        -- Рассчитываем средний рейтинг как в модели
        (
          r."speedRating" + 
          r."qualityRating" + 
          r."accordanceRating" + 
          r."communicationRating" + 
          r."recommendationRating" + 
          r."generalRating"
        )::float / 6 as calculated_rating
      FROM reviews r
      INNER JOIN products p ON r."productId" = p.id
      WHERE p."sellerId" = :sellerId
        AND r.type = 'TO_SELLER' -- если нужно только отзывы на продукты
      ORDER BY r."createdAt"
    ),
    review_groups AS (
      SELECT 
        id,
        calculated_rating,
        "createdAt",
        ROW_NUMBER() OVER (ORDER BY "createdAt") - 
        ROW_NUMBER() OVER (PARTITION BY 
          CASE WHEN calculated_rating <= 1.5 THEN 1 ELSE 0 END 
          ORDER BY "createdAt"
        ) as grp
      FROM seller_reviews
      WHERE calculated_rating <= 1.5 -- 1 звезда или близко к ней
    ),
    consecutive_counts AS (
      SELECT 
        grp,
        COUNT(*) as consecutive_count
      FROM review_groups
      GROUP BY grp
    )
    SELECT COALESCE(MAX(consecutive_count) >= :threshold, false) as has_consecutive
    FROM consecutive_counts`,
      {
        replacements: { sellerId, threshold },
        type: QueryTypes.SELECT,
        plain: true,
      },
    );

    return result?.hasConsecutive || false;
  }

  async getRatingsSummary(sellerId?: number) {
    const reviews = await this.reviewsRepository.findAll({
      include: sellerId
        ? [
            {
              model: Product,
              required: true,
              paranoid: false,
              where: { sellerId },
              attributes: [],
            },
          ]
        : undefined,
    });

    const result = {
      five: 0,
      four: 0,
      three: 0,
      two: 0,
      one: 0,
    };

    for await (const review of reviews) {
      const rating = Math.round(review.rating);

      if (rating === 5) result.five++;
      if (rating === 4) result.four++;
      if (rating === 3) result.three++;
      if (rating === 2) result.two++;
      if (rating === 1) result.one++;
    }

    return result as Ratings;
  }

  async countReviewsBySellerId(sellerId: number) {
    return await this.reviewsRepository.count({
      distinct: true,
      include: [
        {
          model: Product,
          required: true,
          paranoid: false,
          where: { sellerId },
        },
      ],
    });
  }
  async countReviewsForLastYearBySellerId(sellerId: number) {
    return await this.reviewsRepository.count({
      distinct: true,
      where: {
        createdAt: {
          [Op.gte]: new Date(
            new Date().setFullYear(new Date().getFullYear() - 1),
          ),
        },
      },
      include: [
        {
          model: Product,
          paranoid: false,
          required: true,
          where: { sellerId },
        },
      ],
    });
  }

  async countAverageRatingBySellerId(sellerId: number) {
    const result = await this.reviewsRepository.findOne({
      attributes: [
        [
          Sequelize.fn(
            'AVG',
            Sequelize.literal(
              `(COALESCE(CASE WHEN "speedRating" >= 4 THEN "speedRating"::NUMERIC * 1.0 WHEN "speedRating" = 3 THEN "speedRating"::NUMERIC * 0.8 WHEN "speedRating" <= 2 THEN "speedRating"::NUMERIC * 0.4 ELSE 0 END, 0) + COALESCE(CASE WHEN "qualityRating" >= 4 THEN "qualityRating"::NUMERIC * 1.0 WHEN "qualityRating" = 3 THEN "qualityRating"::NUMERIC * 0.8 WHEN "qualityRating" <= 2 THEN "qualityRating"::NUMERIC * 0.4 ELSE 0 END, 0) + COALESCE(CASE WHEN "accordanceRating" >= 4 THEN "accordanceRating"::NUMERIC * 1.0 WHEN "accordanceRating" = 3 THEN "accordanceRating"::NUMERIC * 0.8 WHEN "accordanceRating" <= 2 THEN "accordanceRating"::NUMERIC * 0.4 ELSE 0 END, 0) + COALESCE(CASE WHEN "communicationRating" >= 4 THEN "communicationRating"::NUMERIC * 1.0 WHEN "communicationRating" = 3 THEN "communicationRating"::NUMERIC * 0.8 WHEN "communicationRating" <= 2 THEN "communicationRating"::NUMERIC * 0.4 ELSE 0 END, 0) + COALESCE(CASE WHEN "recommendationRating" >= 4 THEN "recommendationRating"::NUMERIC * 1.0 WHEN "recommendationRating" = 3 THEN "recommendationRating"::NUMERIC * 0.8 WHEN "recommendationRating" <= 2 THEN "recommendationRating"::NUMERIC * 0.4 ELSE 0 END, 0) + COALESCE(CASE WHEN "generalRating" >= 4 THEN "generalRating"::NUMERIC * 1.0 WHEN "generalRating" = 3 THEN "generalRating"::NUMERIC * 0.8 WHEN "generalRating" <= 2 THEN "generalRating"::NUMERIC * 0.4 ELSE 0 END, 0)) / 6.0`,
            ),
          ),
          'averageRating',
        ],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          required: true,
          paranoid: false,
          where: { sellerId },
          attributes: [],
        },
      ],
      raw: true,
    });

    return (
      Number(Number((result as { averageRating?: number })?.averageRating)) ?? 0
    );
  }

  async getProductIdsWithReviews() {
    const matchingIds = await this.reviewsRepository.findAll({
      attributes: [
        'productId',
        [Sequelize.fn('COUNT', Sequelize.col('productId')), 'count'],
      ],
      group: 'productId',
      having: Sequelize.where(
        Sequelize.fn('COUNT', Sequelize.col('productId')),
        { [Op.gt]: 0 },
      ),
    });

    const ids = matchingIds.map((r) => r.productId);

    return ids;
  }

  async validateReview(dto: CreateReviewDto, userId: number) {
    if (dto.type === ReviewType.TO_SELLER) {
      if (!dto.productId || !dto.orderId) {
        throw new BadRequestException(ErrorCause.REVIEW_MISSING_FIELDS);
      }

      const exists = await this.reviewsRepository.findOne({
        where: {
          userId,
          orderId: dto.orderId,
        },
        // @ts-ignore
        hooks: false,
      });
      if (exists) {
        throw new ForbiddenException(ErrorCause.MAX_REVIEWS_PER_ORDER);
      }

      const order = await this.ordersService.getOrderById(dto.orderId);
      if (order.productSnapshot.originalProductId !== dto.productId) {
        throw new ForbiddenException(ErrorCause.REVIEW_PRODUCT_MISMATCH);
      }
    }
    // ! Вынес отдельно
    if (dto.type === ReviewType.TO_REVIEWER) {
      throw new ForbiddenException(ErrorCause.FORBIDDEN);
      // if (!dto.reviewId) {
      //   throw new BadRequestException(ErrorCause.REVIEW_MISSING_FIELDS);
      // }

      // // Существует ли такой отзыв
      // let review;
      // try {
      //   review = await this.reviewsRepository.findByPk(dto.reviewId);
      // } catch (e) {
      //   throw new NotFoundException(ErrorCause.REVIEW_NOT_FOUND);
      // }

      // // Проверка, что у этого отзыва ещё нет ответа
      // try {
      //   await this.reviewsRepository.findOne({
      //     where: {
      //       reviewId: dto.reviewId,
      //     },
      //   });
      //   throw new ForbiddenException(ErrorCause.MAX_ANSWERS_PER_REVIEW);
      // } catch (e) {}

      // // Проверка, что продукт отзыва принадлежит этому пользователю (продавцу)
      // try {
      //   await this.productService.findById(review.productId);
      // } catch (e) {}

      // dto = {
      //   ...dto,
      //   speedRating: undefined,
      //   qualityRating: undefined,
      //   accordanceRating: undefined,
      //   communicationRating: undefined,
      //   recommendationRating: undefined,
      //   generalRating: undefined,
      //   productId: undefined,
      //   orderId: undefined,
      // } as any;
    }
  }

  async createReview(userId: number, dto: CreateReviewDto) {
    await this.validateReview(dto, userId);
    const review = await this.reviewsRepository.create({ ...dto, userId });
    return review.reload({ include: [User, Product, Order] });
  }

  async updateReview(id: number, userId: number, dto: UpdateReviewDto) {
    const review = await this.reviewsRepository.findByPk(id);

    if (review?.userId !== userId) {
      throw new ForbiddenException(ErrorCause.FORBIDDEN);
    }

    await review.update(dto);

    return await review.reload({ include: { all: true, nested: true } });
  }

  async deleteReview(userId: number, id: number) {
    const review = await this.reviewsRepository.findByPk(id);

    if (review?.userId !== userId) {
      throw new ForbiddenException(ErrorCause.FORBIDDEN);
    }

    await this.reviewsRepository.destroy({ where: { id } });

    return true;
  }

  async getReviewByOrderId(orderId: string) {
    try {
      return await this.reviewsRepository.findOne({
        where: { orderId },
      });
    } catch (e) {
      return null;
    }
  }

  async validateAnswerToReview(dto: CreateReviewAnswerDto, userId: number) {
    // Существует ли такой отзыв
    let review;
    try {
      review = await this.reviewsRepository.findByPk(dto.reviewId);
    } catch (e) {
      throw new NotFoundException(ErrorCause.REVIEW_NOT_FOUND);
    }

    // Проверка, что у этого отзыва ещё нет ответа
    const answer = await this.reviewsRepository.findOne({
      where: {
        reviewId: dto.reviewId,
      },
      // @ts-ignore
      hooks: false,
    });
    if (answer) throw new ForbiddenException(ErrorCause.MAX_ANSWERS_PER_REVIEW);

    // Проверка, что продукт отзыва принадлежит этому пользователю (продавцу)

    const product = await this.productService.findById(review.productId);
    if (product?.sellerId !== userId) {
      throw new ForbiddenException(ErrorCause.FORBIDDEN);
    }
  }

  async createAnswerToReview(userId: number, dto: CreateReviewAnswerDto) {
    await this.validateAnswerToReview(dto, userId);

    const obj = { ...dto, type: ReviewType.TO_REVIEWER, userId } as any;
    const review = await this.reviewsRepository.create(obj);
    return review.reload({ include: [User, Product, Order] });
  }

  async updateAnswerToReview(
    id: number,
    userId: number,
    dto: UpdateReviewAnswerDto,
  ) {
    const review = await this.reviewsRepository.findByPk(id);

    if (review?.userId !== userId) {
      throw new ForbiddenException(ErrorCause.FORBIDDEN);
    }

    await review.update(dto);

    return await review.reload();
  }

  async getParentReview(reviewId: number) {
    try {
      return await this.reviewsRepository.findOne({
        where: { id: reviewId },
      });
    } catch (e) {
      return null;
    }
  }

  async getChildReview(parentId: number) {
    try {
      return await this.reviewsRepository.findOne({
        where: { reviewId: parentId },
      });
    } catch (e) {
      return null;
    }
  }
}
