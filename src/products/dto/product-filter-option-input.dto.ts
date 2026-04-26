export class ProductFilterOptionInputDto {
  gameCategoryOptionId: number;
  equals?: string;
  min?: number;
  max?: number;
}

export class ProductPriceFilterInputDto {
  min?: number;
  max?: number;
}
