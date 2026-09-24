import { authenticatedGet } from '../../../api/authenticatedApi';

export type GeocodingResult = {
  name: string;
  country: string;
  lat: number;
  lon: number;
};

class GeocodingApiClient {
  async geocode(city: string): Promise<GeocodingResult> {
    return authenticatedGet<GeocodingResult>(
      `/api/geocoding?city=${encodeURIComponent(city)}`,
      'Could not find that location',
    );
  }
}

export const geocodingApi = new GeocodingApiClient();
