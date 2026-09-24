import { useState, useEffect } from 'react';

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

export function useSelectedCoords() {
  const [coords, setCoords] = useState(readStoredCoords);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
  }, [coords]);
  return { coords, setCoords };
}
