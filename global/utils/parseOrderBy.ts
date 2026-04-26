import { OrderItem } from 'sequelize';

export function parseOrderBy(orderBy: string) {
  const [field, direction] = orderBy.split('_');

  return [field, direction] as OrderItem;
}
