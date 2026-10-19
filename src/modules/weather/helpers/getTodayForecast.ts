import type { HourlyWeather, WeatherData } from '../weather.types';
import { getLocalDate } from './getLocalDate';

export function getTodayForecast(weather: WeatherData | undefined, now: Date): HourlyWeather[] {
  if (!weather) {
    return [];
  }
  const today = getLocalDate(now, weather.timezone);
  const nowMs = now.getTime();
  return weather.hourly.filter((hour) => {
    const hourStartMs = hour.dt * 1000;
    const isToday = getLocalDate(new Date(hourStartMs), weather.timezone) === today;
    const hasNotEnded = hourStartMs + 60 * 60 * 1000 > nowMs;

    return isToday && hasNotEnded;
  });
}
