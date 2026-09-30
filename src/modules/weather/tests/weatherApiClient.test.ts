import { beforeEach, afterEach, expect, it, vi } from 'vitest';

vi.mock('../../../lib/supabase', () => ({ supabase: { auth: { getSession: vi.fn() } } }));
import { supabase } from '../../../lib/supabase';
import { weatherApi } from '../api/weatherApiClient';

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { access_token: 'private-token' } },
    error: null,
  } as Awaited<ReturnType<typeof supabase.auth.getSession>>);
});
afterEach(() => vi.unstubAllGlobals());

it('fetches unchanged Kelvin and Unix-second weather from the authenticated local endpoint', async () => {
  const weather = {
    timezone: 'Europe/Prague',
    hourly: [
      {
        temp: 293.15,
        feels_like: 290.15,
        dt: 1800000000,
        weather: [{ icon: 'clear', description: 'Clear sky' }],
      },
    ],
  };
  fetchMock.mockResolvedValue({ ok: true, json: async () => weather });
  await expect(weatherApi.getData(49.35, -17.86)).resolves.toEqual(weather);
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/weather?lat=49.35&lon=-17.86',
    expect.objectContaining({ headers: { Authorization: 'Bearer private-token' } }),
  );
});
