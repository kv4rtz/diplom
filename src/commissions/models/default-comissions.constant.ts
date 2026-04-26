import { ComissionType, Currency, Locale } from 'src/graphql';
import { ComissionCreationAttrs } from './comissions.model';

export const DEFAULT_COMISSIONS: ComissionCreationAttrs[] = [
  {
    percentage: 5,
    type: ComissionType.REPLENISHMENT,
    uniqueId: 'base-replenishment',
    translations: [
      {
        locale: Locale.ru,
        method: 'Комиссия BetaGames на пополнение',
      },
      {
        locale: Locale.en,
        method: 'BetaGames commission for replenishment',
      },
      {
        locale: Locale.de,
        method: 'BetaGames-Kommission für Nachschub',
      },
    ],
  },
  {
    percentage: 3.5,
    type: ComissionType.REPLENISHMENT,
    currency: Currency.RUB,
    uniqueId: 'bank-card-rub',
    translations: [
      {
        locale: Locale.ru,
        method: 'Банковская карта (RU + СНГ)',
      },
      {
        locale: Locale.en,
        method: 'Bank card (RU + CIS)',
      },
      {
        locale: Locale.de,
        method: 'Bankkarte (RU + GUS)',
      },
    ],
  },
  {
    percentage: 3.5,
    type: ComissionType.REPLENISHMENT,
    currency: Currency.USD,
    uniqueId: 'bank-card-usd',
    translations: [
      {
        locale: Locale.ru,
        method: 'Банковская карта (USD + МИР)',
      },
      {
        locale: Locale.en,
        method: 'Bank card (USD + MIR)',
      },
      {
        locale: Locale.de,
        method: 'Bankkarte (USD + MIR)',
      },
    ],
  },
  {
    percentage: 3.5,
    type: ComissionType.REPLENISHMENT,
    currency: Currency.EUR,
    uniqueId: 'bank-card-eur',
    translations: [
      {
        locale: Locale.ru,
        method: 'Банковская карта (EURO + МИР)',
      },
      {
        locale: Locale.en,
        method: 'Bank card (EURO + MIR)',
      },
      {
        locale: Locale.de,
        method: 'Bankkarte (EURO + MIR)',
      },
    ],
  },
  {
    percentage: 3.5,
    type: ComissionType.REPLENISHMENT,
    currency: Currency.RUB,
    uniqueId: 'sbp',
    translations: [
      {
        locale: Locale.ru,
        method: 'СБП',
      },
      {
        locale: Locale.en,
        method: 'FPS',
      },
      {
        locale: Locale.de,
        method: 'Schnelles Zahlungssystem',
      },
    ],
  },
  {
    percentage: 3.5,
    type: ComissionType.REPLENISHMENT,
    currency: Currency.RUB,
    uniqueId: 'yu-money',
    translations: [
      {
        locale: Locale.ru,
        method: 'ЮMoney',
      },
      {
        locale: Locale.en,
        method: 'ЮMoney',
      },
      {
        locale: Locale.de,
        method: 'ЮMoney',
      },
    ],
  },
  {
    percentage: 3.5,
    type: ComissionType.REPLENISHMENT,
    currency: Currency.USD,
    uniqueId: 'usdt-trc20',
    translations: [
      {
        locale: Locale.ru,
        method: 'USDT TRC-20',
      },
      {
        locale: Locale.en,
        method: 'USDT TRC-20',
      },
      {
        locale: Locale.de,
        method: 'USDT TRC-20',
      },
    ],
  },
  {
    percentage: 3.5,
    type: ComissionType.REPLENISHMENT,
    currency: Currency.USD,
    uniqueId: 'ltc',
    translations: [
      {
        locale: Locale.ru,
        method: 'LTC',
      },
      {
        locale: Locale.en,
        method: 'LTC',
      },
      {
        locale: Locale.de,
        method: 'LTC',
      },
    ],
  },
  {
    percentage: 3.5,
    type: ComissionType.REPLENISHMENT,
    currency: Currency.USD,
    uniqueId: 'eth',
    translations: [
      {
        locale: Locale.ru,
        method: 'Ethereum',
      },
      {
        locale: Locale.en,
        method: 'Ethereum',
      },
      {
        locale: Locale.de,
        method: 'Ethereum',
      },
    ],
  },
];
