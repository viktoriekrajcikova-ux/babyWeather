import type { HourlyWeather } from '../../weatherApiClient';
import { getLocalDate } from './getLocalDate';

export function getTodayForecast(
  hourly: HourlyWeather[],
  timezone: string,
  now: Date,
): HourlyWeather[] {
  const today = getLocalDate(now, timezone);
  const nowMs = now.getTime();

  return hourly.filter((hour) => {
    const hourStartMs = hour.dt * 1000;
    const isToday = getLocalDate(new Date(hourStartMs), timezone) === today;
    const hasNotEnded = hourStartMs + 60 * 60 * 1000 > nowMs;

    return isToday && hasNotEnded;
  });
}
