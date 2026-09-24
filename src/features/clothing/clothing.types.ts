import type { Sex } from '../children/child';

export type BodySlot = 'head' | 'torso' | 'legs' | 'feet' | 'hands' | 'wholeBody';

export type ClothesItem = {
  name: string;
  imageUrl: string;
  slot: BodySlot;
  // teplotní pásmo se porovnává proti POCITOVÉ teplotě (feels_like)
  tempFrom: number | null;
  tempTo: number | null;
  ageFrom: number | null;
  ageTo: number | null;
  sex: Sex | null;
  layer: 'base' | 'mid' | 'outer';
};
