import { Locale } from 'src/graphql';

export class GlobalCategoryTranslationDto {
  readonly locale: Locale;
  readonly name: string;
  readonly description: string;
}
