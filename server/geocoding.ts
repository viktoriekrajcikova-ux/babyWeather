import { z } from 'zod';
import { redis } from './redis.js';

const resultSchema = z.object({
    name: z.string().trim().min(1),
    country: z.string().regex(/^[A-Z]{2}$/),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
});

const upstreamSchema = z.object({
    error: z.literal(false).optional(),
    results: z.array(z.object({
        name: z.string().trim().min(1),
        country_code: z.string().regex(/^[A-Z]{2}$/),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    })).optional(),
});

export async function getGeocoding(city: string) {
    const normalizedCity = city.trim();
    const cacheKey = `babyweather:geocoding:open-meteo:v1:cs:${encodeURIComponent(normalizedCity)}`;
    // Fail closed on Redis read/write errors, matching the weather cache policy.
    const cached = resultSchema.safeParse(await redis.get<unknown>(cacheKey));
    if (cached.success) return cached.data;
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', normalizedCity);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'cs');
    url.searchParams.set('format', 'json');
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Geocoding service request failed');
    const body = upstreamSchema.parse(await response.json());
    const result = body.results?.[0];
    if (!result) return null;
    const place = { name: result.name, country: result.country_code, lat: result.latitude, lon: result.longitude };
    await redis.set(cacheKey, place, { ex: 86400 });
    return place;
}
