import { useQuery } from '@tanstack/react-query';
import { weatherApi } from '../weatherApiClient';

// TODO: refetch, ivalidate, reset
// TODO: tanstack bar zprovoznit
export function useWeather(coords: { lat: number, lon: number }) {
    const { data, isPending, error } = useQuery({
        queryKey: ['weather', coords.lat, coords.lon],
        queryFn: () => weatherApi.getData(coords.lat, coords.lon),
    });

    return {
        weather: data ?? null,
        loading: isPending,
        error: error ? 'Could not load weather' : null,
    };
}
