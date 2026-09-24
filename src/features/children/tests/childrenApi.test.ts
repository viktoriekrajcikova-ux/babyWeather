import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tables } from '../../../types/database';

const { select, from } = vi.hoisted(() => {
  const select = vi.fn();
  const from = vi.fn(() => ({ select }));
  return { select, from };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from })),
}));

let childrenApi: (typeof import('../api/childrenApi'))['childrenApi'];

beforeAll(async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
  ({ childrenApi } = await import('../api/childrenApi'));
});

afterAll(() => {
  vi.unstubAllEnvs();
});

function row(overrides: Partial<Tables<'children'>>): Tables<'children'> {
  return { id: 1, name: 'Ema', age: 2, sex: null, created_at: '', user_id: 'user-A', ...overrides };
}

describe('childrenApi.getChildren', () => {
  beforeEach(() => {
    select.mockReset();
    from.mockClear();
  });

  it.each([
    { stored: 'male', expected: 'male' },
    { stored: 'female', expected: 'female' },
    { stored: null, expected: null },
    { stored: 'nesmysl', expected: null },
  ])('převede databázové sex $stored na $expected', async ({ stored, expected }) => {
    select.mockResolvedValue({ data: [row({ sex: stored })], error: null });

    await expect(childrenApi.getChildren()).resolves.toEqual([
      { id: 1, name: 'Ema', age: 2, sex: expected },
    ]);
    expect(from).toHaveBeenCalledWith('children');
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('převede chybějící jméno na prázdný řetězec', async () => {
    select.mockResolvedValue({ data: [row({ name: null })], error: null });

    await expect(childrenApi.getChildren()).resolves.toEqual([
      { id: 1, name: '', age: 2, sex: null },
    ]);
  });

  it.each([{ data: null }, { data: [] }])(
    'bez řádků vrátí prázdné pole ($data)',
    async ({ data }) => {
      select.mockResolvedValue({ data, error: null });

      await expect(childrenApi.getChildren()).resolves.toEqual([]);
    },
  );

  it('předá chybu Supabase volajícímu', async () => {
    const error = new Error('children request failed');
    select.mockResolvedValue({ data: null, error });

    await expect(childrenApi.getChildren()).rejects.toBe(error);
  });
});
