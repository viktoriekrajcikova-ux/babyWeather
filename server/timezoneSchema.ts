import { z } from 'zod';

export const timezoneSchema = z
  .string()
  .min(1)
  .refine(
    (timezone) => {
      try {
        return Boolean(
          new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
          }).resolvedOptions().timeZone,
        );
      } catch {
        return false;
      }
    },
    { message: 'Unsupported timezone' },
  );
