import { useState, useCallback } from 'react';
import { geocodingApi } from '../geocodingApiClient';

const STORAGE_KEY = 'babyweather:coords';
const DEFAULT_COORDS = { lat: 49.3547, lon: 17.8694 };

function readStoredCoords(): { lat: number; lon: number } {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COORDS;
    try {
        return JSON.parse(raw);
    } catch {
        return DEFAULT_COORDS;
    }
}

export function useLocation() {
    const [coords, setCoords] = useState<{ lat: number, lon: number }>(readStoredCoords);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchLocation = useCallback(async (city: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await geocodingApi.geocode(city);
            const newCoords = { lat: result.lat, lon: result.lon };
            setCoords(newCoords);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newCoords));
        } catch {
            setError('Nepodařilo se najít lokalitu');
        } finally {
            setLoading(false);
        }
    }, []);
        return { coords, loading, error, searchLocation };
}