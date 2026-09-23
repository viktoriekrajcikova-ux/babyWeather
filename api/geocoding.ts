import { supabaseServer } from '../server/supabase.js';
import { z } from 'zod';
import { getGeocoding } from '../server/geocoding.js';
import { geocodingRateLimit } from '../server/geocodingRateLimit.js';

const citySchema = z
  .string()
  .refine((value) => !/\p{Cc}/u.test(value))
  .transform((value) => value.trim())
  .pipe(z.string().min(2).max(100));

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...headers, 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'GET')
      return json({ error: 'Method not allowed' }, 405, { Allow: 'GET' });
    const parts = request.headers.get('Authorization')?.trim().split(/\s+/);
    if (!parts || parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
      return json({ error: 'Unauthorized' }, 401);
    }
    let userId: string;
    try {
      const { data, error } = await supabaseServer.auth.getUser(parts[1]);
      if (
        error &&
        (error.status === undefined ||
          error.status === 0 ||
          error.status === 429 ||
          error.status >= 500)
      ) {
        return json({ error: 'Authentication service unavailable' }, 503);
      }
      if (error || !data.user) return json({ error: 'Unauthorized' }, 401);
      userId = data.user.id;
    } catch {
      return json({ error: 'Authentication service unavailable' }, 503);
    }
    const url = new URL(request.url);
    try {
      decodeURIComponent(url.search.replace(/\+/g, ' '));
    } catch {
      return json({ error: 'Invalid city' }, 400);
    }
    const params = [...url.searchParams.entries()];
    const city = citySchema.safeParse(url.searchParams.get('city'));
    if (params.length !== 1 || params[0][0] !== 'city' || !city.success) {
      return json({ error: 'Invalid city' }, 400);
    }
    try {
      const result = await geocodingRateLimit.limit(userId);
      if (result.reason === 'timeout') throw new Error('Rate limit timeout');
      if (!result.success) return json({ error: 'Too many requests' }, 429);
    } catch {
      return json({ error: 'Rate limit service unavailable' }, 503);
    }
    try {
      const place = await getGeocoding(city.data);
      if (!place) return json({ error: 'Location not found' }, 404);
      return json(place, 200);
    } catch {
      return json({ error: 'Geocoding service unavailable' }, 502);
    }
  },
};
