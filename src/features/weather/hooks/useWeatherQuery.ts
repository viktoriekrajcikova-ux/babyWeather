import { useQuery } from '@tanstack/react-query';
import { weatherApi } from '../api/weatherApiClient';

export function useWeatherQuery(coords: { lat: number; lon: number }) {
  return useQuery({
    queryKey: ['weather', coords.lat, coords.lon],
    queryFn: () => weatherApi.getData(coords.lat, coords.lon),
  });
}
