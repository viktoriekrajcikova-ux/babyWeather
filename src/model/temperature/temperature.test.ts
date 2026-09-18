import { describe, it, expect } from 'vitest';
import { kelvinToCelsius } from './temperature';

describe('kelvinToCelsius', () => {
    it('převede 273.15 K na 0 °C', () => {
        expect(kelvinToCelsius(273.15)).toBe(0);
    });

    it('převede 300 K na ~26.85 °C', () => {
        expect(kelvinToCelsius(300)).toBeCloseTo(26.85);
    });
});