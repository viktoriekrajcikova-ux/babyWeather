import { authenticatedGet } from '../../../api/authenticatedApi';

import type { WeatherData } from '../weather.types';

class WeatherApiClient {
  async getData(lat: number, lon: number): Promise<WeatherData> {
    return authenticatedGet<WeatherData>(
      `/api/weather?lat=${lat}&lon=${lon}`,
      'Could not load weather',
    );
  }
}

export const weatherApi = new WeatherApiClient();
