import type { Sex } from '../children/child';
import type { ClothesItem } from './clothing.types';
import { CLOTHES } from './clothesCatalog';

function matches(item: ClothesItem, feelsLike: number, age: number, sex: Sex | null): boolean {
  return (
    (item.tempFrom === null || item.tempFrom <= feelsLike) &&
    (item.tempTo === null || item.tempTo > feelsLike) &&
    (item.ageFrom === null || item.ageFrom <= age) &&
    (item.ageTo === null || item.ageTo > age) &&
    (item.sex === null || item.sex === sex)
  );
}

function lowerBound(item: ClothesItem): number {
  return item.tempFrom ?? -Infinity;
}
function upperBound(item: ClothesItem): number {
  return item.tempTo ?? Infinity;
}

function isBetterFit(candidate: ClothesItem, current: ClothesItem): boolean {
  if (lowerBound(candidate) !== lowerBound(current)) {
    return lowerBound(candidate) > lowerBound(current);
  }
  return upperBound(candidate) < upperBound(current);
}

export function getOutfit(
  feelsLike: number,
  age: number,
  sex: Sex | null,
  catalog: ClothesItem[] = CLOTHES,
): ClothesItem[] {
  const sexFilter = sex ?? 'male';
  const bySlot = new Map<string, ClothesItem>();

  for (const item of catalog) {
    if (!matches(item, feelsLike, age, sexFilter)) continue;

    const keySlot = item.slot + ':' + item.layer;
    const current = bySlot.get(keySlot);
    if (!current || isBetterFit(item, current)) {
      bySlot.set(keySlot, item);
    }
  }

  if (bySlot.has('wholeBody:outer')) {
    bySlot.delete('torso:outer');
    bySlot.delete('legs:outer');
  }

  return [...bySlot.values()];
}
