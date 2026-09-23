import { z } from 'zod';
import { timezoneSchema } from './timezoneSchema.js';

const conditions: Record<number, { description: string; icon: string }> = {
    0: { description: 'Clear sky', icon: 'clear' },
    1: { description: 'Mainly clear', icon: 'clear' },
    2: { description: 'Partly cloudy', icon: 'partly-cloudy' },
    3: { description: 'Overcast', icon: 'cloudy' },
    45: { description: 'Fog', icon: 'fog' },
    48: { description: 'Depositing rime fog', icon: 'fog' },
    51: { description: 'Light drizzle', icon: 'drizzle' },
    53: { description: 'Moderate drizzle', icon: 'drizzle' },
    55: { description: 'Dense drizzle', icon: 'drizzle' },
    56: { description: 'Light freezing drizzle', icon: 'freezing-rain' },
    57: { description: 'Dense freezing drizzle', icon: 'freezing-rain' },
    61: { description: 'Slight rain', icon: 'rain' },
    63: { description: 'Moderate rain', icon: 'rain' },
    65: { description: 'Heavy rain', icon: 'rain' },
    66: { description: 'Light freezing rain', icon: 'freezing-rain' },
    67: { description: 'Heavy freezing rain', icon: 'freezing-rain' },
    71: { description: 'Slight snowfall', icon: 'snow' },
    73: { description: 'Moderate snowfall', icon: 'snow' },
    75: { description: 'Heavy snowfall', icon: 'snow' },
    77: { description: 'Snow grains', icon: 'snow' },
    80: { description: 'Slight rain showers', icon: 'showers' },
    81: { description: 'Moderate rain showers', icon: 'showers' },
    82: { description: 'Violent rain showers', icon: 'showers' },
    85: { description: 'Slight snow showers', icon: 'snow-showers' },
    86: { description: 'Heavy snow showers', icon: 'snow-showers' },
    95: { description: 'Thunderstorm', icon: 'thunderstorm' },
    96: { description: 'Thunderstorm with slight hail', icon: 'thunderstorm' },
    99: { description: 'Thunderstorm with heavy hail', icon: 'thunderstorm' },
};

const openMeteoSchema = z.object({
    timezone: timezoneSchema,
    hourly: z.object({
        time: z.array(z.number().int().nonnegative()).min(1),
        temperature_2m: z.array(z.number().finite()),
        apparent_temperature: z.array(z.number().finite()),
        weather_code: z.array(z.number().int().refine(code => Object.prototype.hasOwnProperty.call(conditions, code), {
            message: 'Unsupported WMO weather code',
        })),
        is_day: z.array(z.union([z.literal(0), z.literal(1)])),
    }).refine(hourly => [
        hourly.temperature_2m, hourly.apparent_temperature, hourly.weather_code, hourly.is_day,
    ].every(values => values.length === hourly.time.length), {
        message: 'Hourly arrays must have matching lengths',
    }),
});

export function mapOpenMeteoWeather(body: unknown) {
    const { hourly, timezone } = openMeteoSchema.parse(body);
    return { timezone,
        hourly: hourly.time.map((dt, index) => ({
        dt,
        temp: hourly.temperature_2m[index] + 273.15,
        feels_like: hourly.apparent_temperature[index] + 273.15,
        weather: [{ ...conditions[hourly.weather_code[index]] }],
    })) };
}
