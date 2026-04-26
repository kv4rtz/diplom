export class ProductTranslationDto {
  readonly locale: string;
  readonly name: string;
  readonly description: string;
  readonly messageForBuyer?: string;
}
