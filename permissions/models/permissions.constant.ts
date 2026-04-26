export const DEFAULT_PERMISSIONS = [
  {
    name: 'Просмотр текущих комиссий',
    code: 'commissions.view',
  },
  {
    name: 'Изменение комиссий',
    code: 'commissions.update',
  },
  {
    name: 'Создание разделов',
    code: 'game-categories.create',
  },
  {
    name: 'Изменение разделов',
    code: 'game-categories.update',
  },
  {
    name: 'Удаление разделов',
    code: 'game-categories.delete',
  },
  {
    name: 'Создание игр',
    code: 'games.create',
  },
  {
    name: 'Изменение игр',
    code: 'games.update',
  },
  {
    name: 'Удаление игр',
    code: 'games.delete',
  },
  {
    name: 'Создание категорий',
    code: 'global-categories.create',
  },
  {
    name: 'Изменение категорий',
    code: 'global-categories.update',
  },
  {
    name: 'Удаление категорий',
    code: 'global-categories.delete',
  },
  {
    name: 'Сделать заказ проблемным',
    code: 'orders.makeOrderIsProblematic',
  },
  {
    name: 'Сделать заказ приоритетным',
    code: 'orders.makeOrderIsPriority',
  },
  {
    name: 'Просмотр прав',
    code: 'permissions.view',
  },
  {
    name: 'Создание продуктов',
    code: 'products.create',
  },
  {
    name: 'Изменение продуктов',
    code: 'products.update',
  },
  {
    name: 'Просмотр ролей',
    code: 'roles.view',
  },
  {
    name: 'Создание ролей',
    code: 'roles.create',
  },
  {
    name: 'Изменение ролей',
    code: 'roles.update',
  },
  {
    name: 'Удаление ролей',
    code: 'roles.delete',
  },
  {
    name: 'Доступ к админ-панели',
    code: 'admin-panel.access',
  },
  {
    name: 'Просмотр жалоб',
    code: 'product-complaints.view',
  },
  {
    name: 'Изменение статуса жалобы',
    code: 'product-complaints.change-status',
  },
  {
    name: 'Удаление продуктов пользователей',
    code: 'admin.products.delete',
  },
  {
    name: 'Изменение продуктов пользователей',
    code: 'admin.products.update',
  },
  {
    name: 'Просмотр пользователей',
    code: 'users.view',
  },
  {
    name: 'Просмотр тикетов',
    code: 'admin.tickets.view',
  },
  {
    name: 'Прикрепление к тикетам',
    code: 'admin.tickets.take',
  },
  {
    name: 'Возможность решения тикетов',
    code: 'admin.tickets.resolve',
  },
  {
    name: 'Писать в тикеты',
    code: 'admin.tickets.write',
  },
  {
    name: 'Просмотр email пользователей',
    code: 'admin.users.email.view',
  },
  {
    name: 'Удаление пользователей',
    code: 'admin.users.delete',
  },
  {
    name: 'Просмотр жалоб на пользователей',
    code: 'users.complaints.view',
  },
  {
    name: 'Изменение статуса жалобы на пользователей',
    code: 'users.complaints.change-status',
  },
] as const;

export type PermissionCode = (typeof DEFAULT_PERMISSIONS)[number]['code'];
