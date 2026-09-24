import { conditions } from './weatherConditions.js';
import { openMeteoSchema } from './openMeteo.schema.js';

export function mapOpenMeteoWeather(body: unknown) {
  const { hourly, timezone } = openMeteoSchema.parse(body);
  return {
    timezone,
    hourly: hourly.time.map((dt, index) => ({
      dt,
      temp: hourly.temperature_2m[index] + 273.15,
      feels_like: hourly.apparent_temperature[index] + 273.15,
      weather: [{ ...conditions[hourly.weather_code[index]] }],
    })),
  };
}
