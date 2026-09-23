import { authenticatedGet } from './authenticatedApi';

export type WeatherCondition = {
  description: string;
  icon: string;
};

export type HourlyWeather = {
  temp: number;
  feels_like: number;
  dt: number;
  weather: WeatherCondition[];
};

export type WeatherData = {
  hourly: HourlyWeather[];
  timezone: string;
};

class WeatherApiClient {
  async getData(lat: number, lon: number): Promise<WeatherData> {
    return authenticatedGet<WeatherData>(
      `/api/weather?lat=${lat}&lon=${lon}`,
      'Could not load weather',
    );
  }
}

export const weatherApi = new WeatherApiClient();
