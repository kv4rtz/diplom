import { Translations } from 'src/global/decorators/translation-validator.decorator';
import { GameCategoryOptionValuesTranslations } from './game-category-option-values-translation.dto';

export class GameCategoryOptionValues {
  @Translations()
  translations: GameCategoryOptionValuesTranslations[];
}
