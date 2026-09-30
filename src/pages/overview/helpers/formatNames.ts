import type { Child } from '../../../modules/children/children.types';

export function formatNames(children: Child[]): string {
  const names = children.map((c) => c.name).filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}
