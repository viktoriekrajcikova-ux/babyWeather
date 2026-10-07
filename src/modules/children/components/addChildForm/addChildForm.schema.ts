import { z } from 'zod';

export const childNameSchema = z
  .string({ error: 'children.validation.name' })
  .trim()
  .min(2, 'children.validation.name');

export const childAgeSchema = z
  .string({ error: 'children.validation.age' })
  .trim()
  .min(1, 'children.validation.age')
  .transform(Number)
  .pipe(
    z
      .number({ error: 'children.validation.ageRange' })
      .int('children.validation.ageRange')
      .min(0, 'children.validation.ageRange')
      .max(5, 'children.validation.ageRange'),
  );

export const childSexSchema = z
  .enum(['male', 'female', ''], { error: 'children.validation.sex' })
  .transform((value) => (value === '' ? null : value));

export const addChildSchema = z.object({
  name: childNameSchema,
  age: childAgeSchema,
  sex: childSexSchema,
});
