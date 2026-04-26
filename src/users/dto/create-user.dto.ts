import { Currency, Locale } from 'src/graphql';

export class CreateUserDto {
  readonly email: string;
  readonly password: string | null;
  readonly selectedLocale?: Locale;
  readonly selectedCurrency?: Currency;
}
