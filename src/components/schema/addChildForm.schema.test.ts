import { it, expect } from 'vitest';
import {
  addChildSchema,
  childAgeSchema,
  childNameSchema,
  childSexSchema,
} from './addChildForm.schema';

it('odstraní krajní mezery ze jména', () => {
  const name = childNameSchema.parse('  Ema  ');

  expect(name).toBe('Ema');
});

it('odmítne jednoznakové jméno obklopené mezerami', () => {
  const result = childNameSchema.safeParse('  A  ');

  expect(result.success).toBe(false);
});

it('přijme přesně dva znaky po odstranění krajních mezer', () => {
  const result = childNameSchema.safeParse('  Al  ');

  expect(result).toEqual({ success: true, data: 'Al' });
});

it.each(['', '   '])('odmítne prázdný věk %j', (input) => {
  const result = childAgeSchema.safeParse(input);

  expect(result.success).toBe(false);
});

it('přijme věk nula a vrátí číslo', () => {
  const result = childAgeSchema.safeParse('0');

  expect(result).toEqual({ success: true, data: 0 });
});

it('přijme horní hranici věku a vrátí číslo', () => {
  const result = childAgeSchema.safeParse('5');

  expect(result).toEqual({ success: true, data: 5 });
});

it.each(['-1', '6', '1.5', 'abc'])('odmítne neplatný věk %j', (input) => {
  const result = childAgeSchema.safeParse(input);

  expect(result.success).toBe(false);
});

it('převede nevyplněné pohlaví na null', () => {
  const result = childSexSchema.safeParse('');

  expect(result).toEqual({ success: true, data: null });
});

it.each(['male', 'female'])('zachová povolené pohlaví %j', (input) => {
  const result = childSexSchema.safeParse(input);

  expect(result).toEqual({ success: true, data: input });
});

it('odmítne nepovolenou hodnotu pohlaví', () => {
  const result = childSexSchema.safeParse('other');

  expect(result.success).toBe(false);
});

it('ověří celý formulář a vrátí upravená data dítěte', () => {
  const result = addChildSchema.safeParse({
    name: '  Ema  ',
    age: '0',
    sex: '',
  });

  expect(result).toEqual({
    success: true,
    data: { name: 'Ema', age: 0, sex: null },
  });
});
