import { useQuery } from '@tanstack/react-query';
import { weatherApi } from '../weatherApiClient';

export function useWeather(coords: { lat: number, lon: number }) {
    const { data, isPending, error } = useQuery({
        queryKey: ['weather', coords.lat, coords.lon],
        queryFn: () => weatherApi.getData(coords.lat, coords.lon),
    });

    return {
        weather: data ?? null,
        loading: isPending,
        error: error ? 'Nepodařilo se načíst počasí' : null,
    };
}
