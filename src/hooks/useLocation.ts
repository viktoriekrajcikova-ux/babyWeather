import { useState, useCallback } from 'react';
import { geocodingApi } from '../geocodingApiClient';

export function useLocation() {
    const [coords, setCoords] = useState<{ lat: number, lon: number }>({ lat: 49.3547, lon: 17.8694 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchLocation = useCallback(async (city: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await geocodingApi.geocode(city);
            setCoords({ lat: result.lat, lon: result.lon });
        } catch {
            setError('Nepodařilo se najít lokalitu');
        } finally {
            setLoading(false);
        }
    }, []);
        return { coords, loading, error, searchLocation };
}