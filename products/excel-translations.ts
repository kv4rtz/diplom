import { Locale } from 'src/graphql';

export const translationsMap = {
  id: {
    RU: 'ID',
    EN: 'ID',
    DE: 'ID',
  },
  price: {
    RU: 'Цена',
    EN: 'Price',
    DE: 'Preis',
  },
  currency: {
    RU: 'Валюта',
    EN: 'Currency',
    DE: 'Währung',
  },
  autoDelivery: {
    RU: 'Авто-доставка',
    EN: 'Auto delivery',
    DE: 'Automatische Lieferung',
  },
  active: {
    RU: 'Активен',
    EN: 'Active',
    DE: 'Aktiv',
  },
  deactiveAfterSell: {
    RU: 'Деактивировать после продажи',
    EN: 'Deactivate after sale',
    DE: 'Nach Verkauf deaktivieren',
  },
  quantity: {
    RU: 'Количество',
    EN: 'Quantity',
    DE: 'Menge',
  },
  gameCategoryId: {
    RU: 'ID категории',
    EN: 'Category ID',
    DE: 'Kategorie-ID',
  },
  gameCategoryName: {
    RU: 'Название категории',
    EN: 'Category name',
    DE: 'Kategoriename',
  },
  name_ru: {
    RU: 'Название (ru)',
    EN: 'Name (ru)',
    DE: 'Name (ru)',
  },
  description_ru: {
    RU: 'Описание (ru)',
    EN: 'Description (ru)',
    DE: 'Beschreibung (ru)',
  },
  name_en: {
    RU: 'Название (en)',
    EN: 'Name (en)',
    DE: 'Name (en)',
  },
  description_en: {
    RU: 'Описание (en)',
    EN: 'Description (en)',
    DE: 'Beschreibung (en)',
  },
  name_de: {
    RU: 'Название (de)',
    EN: 'Name (de)',
    DE: 'Name (de)',
  },
  description_de: {
    RU: 'Описание (de)',
    EN: 'Description (de)',
    DE: 'Beschreibung (de)',
  },
  imageKeys: {
    RU: 'Ключи изображений',
    EN: 'Image Keys',
    DE: 'Image Keys',
  },
  lots: {
    RU: 'Лоты',
    EN: 'Lots',
    DE: 'Lots',
  },
} as const;

export function tExcel(key: keyof typeof translationsMap, locale: Locale) {
  const base = translationsMap[key][locale.toLocaleUpperCase()];

  return base;
}
