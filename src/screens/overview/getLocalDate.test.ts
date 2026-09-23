import { describe, it, expect } from 'vitest';
import { getLocalDate } from './getLocalDate';

describe('getLocalDate', () => {
  it('určí datum podle vybrané časové zóny', () => {
    const date = new Date('2026-01-15T16:00:00Z');

    expect(getLocalDate(date, 'UTC')).toBe('2026-01-15');
    expect(getLocalDate(date, 'Asia/Tokyo')).toBe('2026-01-16');
  });
});
