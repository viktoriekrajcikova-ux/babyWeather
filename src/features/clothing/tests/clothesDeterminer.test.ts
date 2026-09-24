import { describe, it, expect } from 'vitest';
import { getOutfit } from '../clothesDeterminer';
import { CLOTHES } from '../clothesCatalog';
import type { ClothesItem } from '../clothing.types';

describe('getOutfit', () => {
  it('vrátí pole oblečení', () => {
    const result = getOutfit(25, 5, 'female');

    expect(Array.isArray(result)).toBe(true);
  });

  it('pro teplo vybere letní oblečení pro holčičku', () => {
    const result = getOutfit(25, 5, 'female');
    const names = result.map((item) => item.name);

    expect(names).toEqual(['shirt', 'skirt', 'hat', 'sandals']);
  });

  it('zahrne tričko přesně na spodní hranici 20 °C', () => {
    const result = getOutfit(20, 5, 'female');
    const names = result.map((item) => item.name);

    expect(names).toContain('shirt');
  });

  it('vyřadí tričko těsně pod hranicí (19 °C)', () => {
    const result = getOutfit(19, 5, 'female');
    const names = result.map((item) => item.name);

    expect(names).not.toContain('shirt');
  });

  it('v 1 roce dítě nedostane baby clothes', () => {
    const result = getOutfit(25, 1, null);
    const names = result.map((item) => item.name);

    expect(names).not.toContain('baby clothes');
    expect(names).toContain('shirt');
    expect(names).toContain('shorts');
  });

  it('od 2 let už baby clothes nedostane', () => {
    const result = getOutfit(25, 2, null);
    const names = result.map((item) => item.name);

    expect(names).not.toContain('baby clothes');
  });

  it('kluk dostane kraťasy, ne sukni', () => {
    const result = getOutfit(25, 5, 'male');
    const names = result.map((item) => item.name);

    expect(names).toContain('shorts');
    expect(names).not.toContain('skirt');
  });

  it('holka dostane sukni, ne kraťasy', () => {
    const result = getOutfit(25, 5, 'female');
    const names = result.map((item) => item.name);

    expect(names).toContain('skirt');
    expect(names).not.toContain('shorts');
  });

  it('každý kus v katalogu má přiřazený slot', () => {
    expect(CLOTHES.every((item) => item.slot)).toBe(true);
  });

  it('při nevyplněném pohlaví doporučí kraťasy', () => {
    const result = getOutfit(25, 2, null);
    const names = result.map((item) => item.name);

    expect(names).toContain('shorts');
  });

  it('těsně před 1. narozeninami dítě dostane baby clothes', () => {
    const result = getOutfit(25, 0.99, null);
    const names = result.map((item) => item.name);

    expect(names).toContain('baby clothes');
    expect(names).toContain('shorts');
  });

  it('těsně pod 25 °C dítě dostane boty, ne sandály', () => {
    const result = getOutfit(24.99, 2, null);
    const names = result.map((item) => item.name);

    expect(names).not.toContain('sandals');
    expect(names).toContain('shoes');
  });

  it('přesně při 25 °C dítě dostane sandály, ne boty', () => {
    const result = getOutfit(25, 2, null);
    const names = result.map((item) => item.name);

    expect(names).not.toContain('shoes');
    expect(names).toContain('sandals');
  });

  it('přesně při 20 °C dítě dostane boty, ne sandaly', () => {
    const result = getOutfit(20, 2, null);
    const names = result.map((item) => item.name);

    expect(names).not.toContain('sandals');
    expect(names).toContain('shoes');
  });

  it('půlroční holčička dostane body a kraťasy, ne sukni', () => {
    const result = getOutfit(25, 0.5, 'female');
    const names = result.map((item) => item.name);
    expect(result.some((item) => item.slot === 'head')).toBe(true);

    expect(names).not.toContain('skirt');
    expect(names).toContain('baby clothes');
    expect(names).toContain('shorts');
  });

  it('při 5 °C dítě dostane dlouhé tričko i zimní bundu', () => {
    const result = getOutfit(5, 2, null);
    const names = result.map((item) => item.name);
    expect(result.some((item) => item.slot === 'head')).toBe(true);

    expect(names).toContain('long shirt');
    expect(names).toContain('winter jacket');
  });

  it('kombinéza ponechá základní vrstvy', () => {
    const result = getOutfit(5, 0.5, null);
    const names = result.map((item) => item.name);

    expect(names).toContain('snowsuit');
    expect(names).toContain('long sleeve body');
    expect(names).toContain('tights');
  });

  it('kombinéza nahradí svrchní bundu a kalhoty', () => {
    const catalog: ClothesItem[] = [
      {
        name: 'snowsuit',
        imageUrl: 'assets/img/snowsuit.png',
        slot: 'wholeBody',
        tempFrom: null,
        tempTo: 15,
        ageFrom: 0,
        ageTo: null,
        sex: null,
        layer: 'outer',
      },
      {
        name: 'winter jacket',
        imageUrl: 'assets/img/snowsuit.png',
        slot: 'torso',
        tempFrom: null,
        tempTo: 15,
        ageFrom: 0,
        ageTo: null,
        sex: null,
        layer: 'outer',
      },
      {
        name: 'winter pants',
        imageUrl: 'assets/img/snowsuit.png',
        slot: 'legs',
        tempFrom: null,
        tempTo: 15,
        ageFrom: 0,
        ageTo: null,
        sex: null,
        layer: 'outer',
      },
    ];

    const result = getOutfit(5, 0.5, null, catalog);
    const names = result.map((item) => item.name);
    expect(names).toEqual(['snowsuit']);
  });

  it('při 17 °C dítě dostane kompletní outfit bez bundy', () => {
    const result = getOutfit(17, 2, null);
    const names = result.map((item) => item.name);

    expect(names.sort()).toEqual(
      ['hat', 'long shirt', 'shoes', 'sweater', 'warm sweatpants'].sort(),
    );
    expect(result.filter((item) => item.slot === 'legs').map((item) => item.layer)).toEqual([
      'base',
    ]);
    expect(result.some((item) => item.layer === 'outer')).toBe(false);
  });

  describe.each([null, 'male', 'female'] as const)('mírné počasí pro sex=%s', (sex) => {
    it.each([
      [15, 1],
      [15, 2],
      [15.01, 2],
      [16.99, 2],
      [17, 2],
      [19.99, 1],
      [19.99, 2],
    ])('při %s °C a věku %s vrátí právě požadované kusy a vrstvy', (temperature, age) => {
      const result = getOutfit(temperature, age, sex);
      const pieces = result.map((item) => `${item.slot}:${item.layer}:${item.name}`);

      expect(pieces.sort()).toEqual(
        [
          'head:base:hat',
          'torso:base:long shirt',
          'torso:mid:sweater',
          'legs:base:warm sweatpants',
          'feet:base:shoes',
        ].sort(),
      );
    });

    it('přesně při 20 °C přejde na letní outfit', () => {
      const names = getOutfit(20, 1, sex).map((item) => item.name);

      expect(names.sort()).toEqual(
        ['shirt', sex === 'female' ? 'skirt' : 'shorts', 'hat', 'shoes'].sort(),
      );
    });
  });

  it.each([14.99, 20])('při %s °C nevybere tepláky z mírného pásma', (temperature) => {
    const names = getOutfit(temperature, 2, null).map((item) => item.name);

    expect(names).not.toContain('warm sweatpants');
  });

  it('těsně před prvními narozeninami nevybere tepláky ani boty staršího dítěte', () => {
    const names = getOutfit(17, 0.99, null).map((item) => item.name);

    // Úplný outfit miminka patří do samostatného scénáře.
    expect(names).not.toContain('warm sweatpants');
    expect(names).not.toContain('shoes');
  });
});
