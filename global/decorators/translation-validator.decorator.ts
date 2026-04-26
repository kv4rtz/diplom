import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'uniqueLanguages', async: false })
export class UniqueLanguagesConstraint implements ValidatorConstraintInterface {
  private readonly requiredLanguages = ['ru', 'en', 'de'];

  validate(translations: any[], args: ValidationArguments): boolean {
    if (!Array.isArray(translations) || translations.length !== 3) {
      return false;
    }

    const languages = translations.map((t) => t.locale);

    const uniqueLanguages = new Set(languages);
    if (uniqueLanguages.size !== 3) {
      return false;
    }

    return this.requiredLanguages.every((lang) => languages.includes(lang));
  }

  defaultMessage(args: ValidationArguments): string {
    return `translations must contain exactly 3 unique items for languages: ru, en, de`;
  }
}

export function Translations(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: UniqueLanguagesConstraint,
    });
  };
}
