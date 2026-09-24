import { getOutfit } from '../clothesDeterminer';
import type { ClothesItem } from '../clothing.types';
import type { Child } from '../../children/child';

// Spojí oblečení pro všechny zbývající dnešní hodiny bez duplicit.
export function packForToday(child: Child, feels: number[]): ClothesItem[] {
  const outfits = feels.flatMap((temp) => getOutfit(temp, child.age, child.sex));
  const byName = new Map<string, ClothesItem>();
  for (const item of outfits) {
    if (!byName.has(item.name)) {
      byName.set(item.name, item);
    }
  }
  return [...byName.values()];
}
