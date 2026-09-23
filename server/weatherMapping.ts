import { z } from 'zod';
import { timezoneSchema } from './timezoneSchema.js';

const conditions: Record<number, { description: string; icon: string }> = {
    0: { description: 'jasno', icon: 'clear' },
    1: { description: 'převážně jasno', icon: 'clear' },
    2: { description: 'polojasno', icon: 'partly-cloudy' },
    3: { description: 'zataženo', icon: 'cloudy' },
    45: { description: 'mlha', icon: 'fog' },
    48: { description: 'mlha s námrazou', icon: 'fog' },
    51: { description: 'slabé mrholení', icon: 'drizzle' },
    53: { description: 'mírné mrholení', icon: 'drizzle' },
    55: { description: 'silné mrholení', icon: 'drizzle' },
    56: { description: 'slabé mrznoucí mrholení', icon: 'freezing-rain' },
    57: { description: 'silné mrznoucí mrholení', icon: 'freezing-rain' },
    61: { description: 'slabý déšť', icon: 'rain' },
    63: { description: 'mírný déšť', icon: 'rain' },
    65: { description: 'silný déšť', icon: 'rain' },
    66: { description: 'slabý mrznoucí déšť', icon: 'freezing-rain' },
    67: { description: 'silný mrznoucí déšť', icon: 'freezing-rain' },
    71: { description: 'slabé sněžení', icon: 'snow' },
    73: { description: 'mírné sněžení', icon: 'snow' },
    75: { description: 'silné sněžení', icon: 'snow' },
    77: { description: 'sněhová zrna', icon: 'snow' },
    80: { description: 'slabé dešťové přeháňky', icon: 'showers' },
    81: { description: 'mírné dešťové přeháňky', icon: 'showers' },
    82: { description: 'silné dešťové přeháňky', icon: 'showers' },
    85: { description: 'slabé sněhové přeháňky', icon: 'snow-showers' },
    86: { description: 'silné sněhové přeháňky', icon: 'snow-showers' },
    95: { description: 'bouřka', icon: 'thunderstorm' },
    96: { description: 'bouřka se slabým krupobitím', icon: 'thunderstorm' },
    99: { description: 'bouřka se silným krupobitím', icon: 'thunderstorm' },
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
