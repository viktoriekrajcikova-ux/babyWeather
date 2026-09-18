import { z } from 'zod'; 

 export const childNameSchema = z.string().trim().min(2, 'Name must contain at least 2 characters');

 export const childAgeSchema = z.string().trim().min(1, 'Select an age').transform(Number).pipe(z.number().int().min(0).max(5));

 export const childSexSchema =  z.enum(['male', 'female', '']).transform(value => value === '' ? null : value);

 export const addChildSchema = z.object({
     name: childNameSchema,
     age: childAgeSchema,
     sex: childSexSchema
 });