import { z } from 'zod';
import { timezoneSchema } from './timezone.schema.js';
import { conditions } from './weatherConditions.js';

export const openMeteoSchema = z.object({
  timezone: timezoneSchema,
  hourly: z
    .object({
      time: z.array(z.number().int().nonnegative()).min(1),
      temperature_2m: z.array(z.number().finite()),
      apparent_temperature: z.array(z.number().finite()),
      weather_code: z.array(
        z
          .number()
          .int()
          .refine((code) => Object.prototype.hasOwnProperty.call(conditions, code), {
            message: 'Unsupported WMO weather code',
          }),
      ),
      is_day: z.array(z.union([z.literal(0), z.literal(1)])),
    })
    .refine(
      (hourly) =>
        [
          hourly.temperature_2m,
          hourly.apparent_temperature,
          hourly.weather_code,
          hourly.is_day,
        ].every((values) => values.length === hourly.time.length),
      {
        message: 'Hourly arrays must have matching lengths',
      },
    ),
});
