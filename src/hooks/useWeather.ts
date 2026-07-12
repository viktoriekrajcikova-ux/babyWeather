import { useState, useEffect } from 'react';
import { weatherApi } from '../weatherApiClient';
import type { WeatherData } from '../weatherApiClient';

export function useWeather(coords: { lat: number, lon: number }) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await weatherApi.getData(coords.lat, coords.lon);
                if (!cancelled) setWeather(data);
            } catch {
                if (!cancelled) setError('Nepodařilo se načíst počasí');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [coords.lat, coords.lon]);

    return { weather, loading, error };
}
