import { z } from 'zod';
import { redis } from './redis.js';
import { mapOpenMeteoWeather } from './weatherMapping.js';

const weatherSchema = z.object({
    hourly: z.array(z.object({
        temp: z.number(),
        feels_like: z.number(),
        dt: z.number(),
        weather: z.array(z.object({
            description: z.string(),
            icon: z.string(),
        })).min(1),
    })).min(1),
});

export async function getWeather(lat: number, lon: number) {
    const cacheKey = `babyweather:weather:openmeteo:v1:${lat}:${lon}:cs`;
    const cached = await redis.get<unknown>(cacheKey);

    if (cached !== null) {
        const parsed = weatherSchema.safeParse(cached);
        if (parsed.success) {
            return parsed.data;
        }
    }

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('hourly', 'temperature_2m,apparent_temperature,weather_code,is_day');
    url.searchParams.set('forecast_hours', '48');
    url.searchParams.set('timeformat', 'unixtime');
    url.searchParams.set('timezone', 'UTC');
    url.searchParams.set('temperature_unit', 'celsius');

    const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
        throw new Error('Weather service request failed');
    }

    const body: unknown = await response.json();
    const weather = weatherSchema.parse(mapOpenMeteoWeather(body));
    await redis.set(cacheKey, weather, { ex: 300 });
    return weather;
}