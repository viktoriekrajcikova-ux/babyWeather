import type { SelectedLocation } from '../types';

export const STORAGE_KEY = 'babyweather:coords';
const DEFAULT_COORDS = { lat: 49.3547, lon: 17.8694 };

export function readStoredCoords(): SelectedLocation {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COORDS;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return DEFAULT_COORDS;
    const location = value as Record<string, unknown>;
    if (
      typeof location.lat !== 'number' ||
      !Number.isFinite(location.lat) ||
      location.lat < -90 ||
      location.lat > 90 ||
      typeof location.lon !== 'number' ||
      !Number.isFinite(location.lon) ||
      location.lon < -180 ||
      location.lon > 180 ||
      (location.name !== undefined && typeof location.name !== 'string') ||
      (location.country !== undefined && typeof location.country !== 'string')
    )
      return DEFAULT_COORDS;
    return {
      lat: location.lat,
      lon: location.lon,
      name: location.name,
      country: location.country,
    };
  } catch {
    return DEFAULT_COORDS;
  }
}
