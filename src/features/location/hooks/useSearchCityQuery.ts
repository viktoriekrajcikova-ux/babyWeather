import { geocodingApi } from '../api/geocodingApiClient';
import { useQuery } from '@tanstack/react-query';

export function useSearchCityQuery(searchedCity: string) {
  return useQuery({
    queryKey: ['geocoding', searchedCity],
    queryFn: () => geocodingApi.geocode(searchedCity),
    enabled: searchedCity.length > 0,
  });
}
