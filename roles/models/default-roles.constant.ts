import { Locale } from 'src/graphql';
import { DEFAULT_PERMISSIONS } from 'src/permissions/models/permissions.constant';
import { CreateRoleDto } from '../dto/create-role.dto';

export const DEFAULT_ROLES: (Omit<CreateRoleDto, 'permissions'> & {
  permissions: string[];
})[] = [
  {
    code: 'developer',
    translations: [
      {
        locale: Locale.ru,
        name: 'Разработчик',
      },
      {
        locale: Locale.en,
        name: 'Developer',
      },
      {
        locale: Locale.de,
        name: 'Entwickler',
      },
    ],
    permissions: DEFAULT_PERMISSIONS.map((p) => p.code),
  },
  {
    code: 'owner',
    translations: [
      {
        locale: Locale.ru,
        name: 'Владелец',
      },
      {
        locale: Locale.en,
        name: 'Owner',
      },
      {
        locale: Locale.de,
        name: 'Besitzer',
      },
    ],
    permissions: [
      'commissions.view',
      'commissions.update',
      'game-categories.create',
      'game-categories.update',
      'game-categories.delete',
      'games.create',
      'games.update',
      'games.delete',
      'global-categories.create',
      'global-categories.update',
      'global-categories.delete',
      'orders.makeOrderIsProblematic',
      'orders.makeOrderIsPriority',
      'permissions.view',
      'products.create',
      'products.update',
      'roles.view',
      'admin-panel.access',
    ],
  },
  {
    code: 'chief-administrator',
    translations: [
      {
        locale: Locale.ru,
        name: 'Главный администратор',
      },
      {
        locale: Locale.en,
        name: 'Chief administrator',
      },
      {
        locale: Locale.de,
        name: 'Hauptadministrator',
      },
    ],
    permissions: [
      'commissions.view',
      'game-categories.create',
      'game-categories.update',
      'game-categories.delete',
      'games.create',
      'games.update',
      'games.delete',
      'global-categories.create',
      'global-categories.update',
      'global-categories.delete',
      'orders.makeOrderIsProblematic',
      'orders.makeOrderIsPriority',
      'permissions.view',
      'products.create',
      'products.update',
      'roles.view',
      'admin-panel.access',
    ],
  },
  {
    code: 'administrator',
    translations: [
      {
        locale: Locale.ru,
        name: 'Администратор',
      },
      {
        locale: Locale.en,
        name: 'Administrator',
      },
      {
        locale: Locale.de,
        name: 'Administrator',
      },
    ],
    permissions: [
      'game-categories.create',
      'game-categories.update',
      'game-categories.delete',
      'games.create',
      'games.update',
      'games.delete',
      'global-categories.create',
      'global-categories.update',
      'global-categories.delete',
      'orders.makeOrderIsProblematic',
      'orders.makeOrderIsPriority',
      'products.create',
      'products.update',
      'roles.view',
      'admin-panel.access',
    ],
  },
  {
    code: 'chief-arbitration',
    translations: [
      {
        locale: Locale.ru,
        name: 'Главный арбитраж',
      },
      {
        locale: Locale.en,
        name: 'Chief arbitration',
      },
      {
        locale: Locale.de,
        name: 'Hauptschiedsverfahren',
      },
    ],
    permissions: ['admin-panel.access'],
  },
  {
    code: 'arbitration',
    translations: [
      {
        locale: Locale.ru,
        name: 'Арбитраж',
      },
      {
        locale: Locale.en,
        name: 'Arbitration',
      },
      {
        locale: Locale.de,
        name: 'Schiedsverfahren',
      },
    ],
    permissions: ['admin-panel.access'],
  },
  {
    code: 'technical-support',
    translations: [
      {
        locale: Locale.ru,
        name: 'Техническая поддержка',
      },
      {
        locale: Locale.en,
        name: 'Technical support',
      },
      {
        locale: Locale.de,
        name: 'Technische Unterstützung',
      },
    ],
    permissions: ['admin-panel.access'],
  },
  {
    code: 'chief-moderator',
    translations: [
      {
        locale: Locale.ru,
        name: 'Главный модератор',
      },
      {
        locale: Locale.en,
        name: 'Chief moderator',
      },
      {
        locale: Locale.de,
        name: 'Hauptmoderator',
      },
    ],
    permissions: ['admin-panel.access'],
  },
  {
    code: 'moderator',
    translations: [
      {
        locale: Locale.ru,
        name: 'Модератор',
      },
      {
        locale: Locale.en,
        name: 'Moderator',
      },
      {
        locale: Locale.de,
        name: 'Moderator',
      },
    ],
    permissions: ['admin-panel.access'],
  },
  {
    code: 'support',
    translations: [
      {
        locale: Locale.ru,
        name: 'Поддержка',
      },
      {
        locale: Locale.en,
        name: 'Support',
      },
      {
        locale: Locale.de,
        name: 'Unterstützung',
      },
    ],
    permissions: [
      'orders.makeOrderIsProblematic',
      'orders.makeOrderIsPriority',
      'admin-panel.access',
    ],
  },
  {
    code: 'seller',
    translations: [
      {
        locale: Locale.ru,
        name: 'Продавец',
      },
      {
        locale: Locale.en,
        name: 'Seller',
      },
      {
        locale: Locale.de,
        name: 'Verkäufer',
      },
    ],
    permissions: ['products.create', 'products.update'],
  },
];
