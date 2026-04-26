export function getEnumValues<T extends object>(enumObj: T): string[] {
  return Object.entries(enumObj)
    .filter((_, index) => index % 2 === 0)
    .map(([_, value]) => value as string);
}
