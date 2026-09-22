import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./supabaseApiClient', () => ({ supabase: { auth: { getSession: vi.fn() } } }));
import { supabase } from './supabaseApiClient';
import { weatherApi } from './weatherApiClient';
import { geocodingApi } from './geocodingApiClient';
const fetchMock = vi.fn();
const session = (token: string) => ({ data: { session: { access_token: token } }, error: null } as Awaited<ReturnType<typeof supabase.auth.getSession>>);
beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    vi.mocked(supabase.auth.getSession).mockReset().mockResolvedValue(session('private-token'));
});
afterEach(() => vi.unstubAllGlobals());

const clients = [
    { name: 'weather', call: () => weatherApi.getData(49, 17), message: 'Could not load weather' },
    { name: 'geocoding', call: () => geocodingApi.geocode('Praha'), message: 'Could not find that location' },
];
it.each(clients)('$name does not fetch without a session', async ({ call, message }) => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    await expect(call()).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
});
it.each(clients)('$name masks session errors', async ({ call, message }) => {
    vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('private-token'));
    await expect(call()).rejects.toEqual(new Error(message));
    expect(fetchMock).not.toHaveBeenCalled();
});
it.each(clients)('$name masks network errors', async ({ call, message }) => {
    fetchMock.mockRejectedValue(new Error('private-token'));
    await expect(call()).rejects.toEqual(new Error(message));
});
it.each(clients)('$name does not expose a failed API response body', async ({ call, message }) => {
    const json = vi.fn().mockResolvedValue({ error: 'private-token' });
    fetchMock.mockResolvedValue({ ok: false, status: 401, json });
    await expect(call()).rejects.toEqual(new Error(message));
    expect(json).not.toHaveBeenCalled();
});
it.each(clients)('$name masks malformed JSON', async ({ call, message }) => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new Error('private-token'); } });
    await expect(call()).rejects.toEqual(new Error(message));
});
it('reads the current token for each request instead of retaining stale credentials', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    await weatherApi.getData(49, 17);
    vi.mocked(supabase.auth.getSession).mockResolvedValue(session('refreshed-token'));
    await geocodingApi.geocode('Praha');
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer refreshed-token');
});
