import { useQuery } from '@tanstack/react-query';

import { geocodingApi } from '../api/geocodingApiClient';

export function useSearchCityQuery(searchedCity: string) {
  return useQuery({
    queryKey: ['geocoding', searchedCity],
    queryFn: () => geocodingApi.geocode(searchedCity),
    enabled: searchedCity.length > 0,
    meta: {
      errorToast: {
        load: 'location.searchError',
        refresh: 'location.searchError',
        hint: 'location.searchHint',
        id: 'location-search',
      },
    },
  });
}
