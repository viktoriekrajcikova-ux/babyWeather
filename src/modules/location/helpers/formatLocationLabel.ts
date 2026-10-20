import type { SelectedLocation } from '../types';

export function formatLocationLabel(coords: SelectedLocation): string {
  return coords.name
    ? [coords.name, coords.country].filter(Boolean).join(', ')
    : `${coords.lat}, ${coords.lon}`;
}
