import { describe, expect, it } from 'vitest';
import { getOutfit } from './clothesDeterminer';

const winterChild = [
  'torso:base:long shirt',
  'torso:outer:winter jacket',
  'legs:base:thin sweatpants',
  'legs:outer:winter pants',
  'head:base:winter hat',
  'feet:base:snow boots',
];

function pieces(temperature: number, age: number, sex: 'male' | 'female' | null) {
  return getOutfit(temperature, age, sex)
    .map((item) => `${item.slot}:${item.layer}:${item.name}`)
    .sort();
}

describe.each([null, 'male', 'female'] as const)('teplotní pásma, sex=%s', (sex) => {
  describe.each([0, 0.5, 0.99])('miminko, věk=%s', (age) => {
    it.each([20, 20.01, 24.99, 25, 25.01, 30])(
      'při %s °C má letní body, kraťasy a pokrývku hlavy',
      (temperature) => {
        expect(pieces(temperature, age, sex)).toEqual(
          ['torso:base:baby clothes', 'legs:base:shorts', 'head:base:hat'].sort(),
        );
      },
    );
    it.each([10, 10.01, 12, 14.99, 15, 15.01, 17, 19.99])(
      'při %s °C má přechodovou kombinézu a správné spodní vrstvy',
      (temperature) => {
        expect(pieces(temperature, age, sex)).toEqual(
          [
            'torso:base:long sleeve body',
            'legs:base:tights',
            'wholeBody:outer:transition suit',
            'head:base:hat',
            ...(temperature < 15 ? ['torso:mid:sweater'] : []),
          ].sort(),
        );
      },
    );
    it.each([-15, -0.01, 0, 0.01, 5, 9.99])(
      'při %s °C ponechá body, mikinu a punčochy pod zimní kombinézou',
      (temperature) => {
        expect(pieces(temperature, age, sex)).toEqual(
          [
            'torso:base:long sleeve body',
            'torso:mid:sweater',
            'legs:base:tights',
            'wholeBody:outer:snowsuit',
            'head:base:winter hat',
            ...(temperature < 0 ? ['hands:base:glove'] : []),
          ].sort(),
        );
      },
    );
  });
  describe.each([1, 2])('dítě od jednoho roku, věk=%s', (age) => {
    it.each([15, 15.01, 17, 19.99])('při %s °C má úplný mírný outfit', (temperature) => {
      expect(pieces(temperature, age, sex)).toEqual(
        [
          'torso:base:long shirt',
          'torso:mid:sweater',
          'legs:base:warm sweatpants',
          'head:base:hat',
          'feet:base:shoes',
        ].sort(),
      );
    });
    it.each([20, 20.01, 24.99, 25, 25.01, 30])(
      'při %s °C má letní outfit s odpovídající obuví',
      (temperature) => {
        expect(pieces(temperature, age, sex)).toEqual(
          [
            'torso:base:shirt',
            `legs:base:${sex === 'female' ? 'skirt' : 'shorts'}`,
            'head:base:hat',
            `feet:base:${temperature < 25 ? 'shoes' : 'sandals'}`,
          ].sort(),
        );
      },
    );
    it.each([-15, -5, -0.01])(
      'při %s °C má mrazový outfit s mikinou a rukavicemi',
      (temperature) => {
        expect(pieces(temperature, age, sex)).toEqual(
          [
            'torso:base:long shirt',
            'torso:mid:sweater',
            'torso:outer:winter jacket',
            'legs:base:warm sweatpants',
            'legs:outer:winter pants',
            'head:base:winter hat',
            'feet:base:snow boots',
            'hands:base:glove',
          ].sort(),
        );
      },
    );
    it.each([0, 0.01, 5, 9.99])('při %s °C má úplný zimní outfit', (temperature) => {
      expect(pieces(temperature, age, sex)).toEqual([...winterChild].sort());
    });
    it.each([10, 10.01, 12, 13, 14.99])(
      'při %s °C má přechodovou bundu a dvě vrstvy na nohou',
      (temperature) => {
        expect(pieces(temperature, age, sex)).toEqual(
          [
            'torso:base:long shirt',
            'torso:outer:transition jacket',
            'legs:base:thin sweatpants',
            'legs:outer:insulated pants',
            'head:base:hat',
            'feet:base:shoes',
          ].sort(),
        );
      },
    );
  });
});
