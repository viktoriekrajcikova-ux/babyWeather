import { afterEach, expect, it, vi } from 'vitest';
vi.mock('./supabaseApiClient', () => ({ supabase: { auth: { getSession: vi.fn() } } }));
import { supabase } from './supabaseApiClient';
import { geocodingApi } from './geocodingApiClient';
afterEach(() => vi.unstubAllGlobals());

it('uses an encoded local geocoding query and current bearer session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { access_token: 'private-token' } }, error: null } as Awaited<ReturnType<typeof supabase.auth.getSession>>);
    const location = { name: 'Žďár nad Sázavou', country: 'CZ', lat: 49.56, lon: 15.94 };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => location });
    vi.stubGlobal('fetch', fetchMock);
    await expect(geocodingApi.geocode('Žďár & Praha')).resolves.toEqual(location);
    expect(fetchMock).toHaveBeenCalledWith(`/api/geocoding?city=${encodeURIComponent('Žďár & Praha')}`, expect.objectContaining({ headers: { Authorization: 'Bearer private-token' } }));
});
