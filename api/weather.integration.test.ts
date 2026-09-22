// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import weather from './weather';

const { getUser, limit, redisGet, redisSet, cache } = vi.hoisted(() => ({
    getUser: vi.fn(), limit: vi.fn(), redisGet: vi.fn(), redisSet: vi.fn(),
    cache: new Map<string, unknown>(),
}));
vi.mock('../server/supabase', () => ({ supabaseServer: { auth: { getUser } } }));
vi.mock('../server/rateLimit', () => ({ weatherRateLimit: { limit } }));
vi.mock('../server/redis', () => ({ redis: { get: redisGet, set: redisSet } }));

const fetchMock = vi.fn<typeof fetch>();
const upstream = {
    hourly: {
        time: [1700000000], temperature_2m: [0], apparent_temperature: [-2],
        weather_code: [3], is_day: [1],
    },
};
const expected = { hourly: [{
    dt: 1700000000, temp: 273.15, feels_like: 271.15,
    weather: [{ description: 'zataženo', icon: 'cloudy' }],
}] };
const request = () => new Request('https://example.test/api/weather?lat=50&lon=14', {
    headers: { Authorization: 'Bearer test-token' },
});

describe('weather endpoint with real Open-Meteo adapter and cache flow', () => {
    beforeEach(() => {
        cache.clear();
        getUser.mockReset().mockResolvedValue({ data: { user: { id: 'user-A' } }, error: null });
        limit.mockReset().mockResolvedValue({ success: true });
        redisGet.mockReset().mockImplementation(async (key: string) => cache.get(key) ?? null);
        redisSet.mockReset().mockImplementation(async (key: string, value: unknown) => {
            cache.set(key, value);
            return 'OK';
        });
        fetchMock.mockReset().mockImplementation(async () => Response.json(upstream));
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => { vi.unstubAllGlobals(); });

    it('authenticates both requests but fetches provider data only on cache miss', async () => {
        const first = await weather.fetch(request());
        const second = await weather.fetch(request());

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
        expect(await first.json()).toEqual(expected);
        expect(await second.json()).toEqual(expected);
        expect(getUser).toHaveBeenCalledTimes(2);
        expect(limit).toHaveBeenCalledTimes(2);
        expect(limit).toHaveBeenCalledWith('user-A');
        expect(redisGet).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(redisSet).toHaveBeenCalledWith('babyweather:weather:openmeteo:v1:50:14:cs', expected, { ex: 300 });
    });

    it('does not disclose cached weather when token verification fails', async () => {
        cache.set('babyweather:weather:openmeteo:v1:50:14:cs', expected);
        getUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 401 } });

        const response = await weather.fetch(request());

        expect(response.status).toBe(401);
        expect(limit).not.toHaveBeenCalled();
        expect(redisGet).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('enforces the user limit even when weather is cached', async () => {
        cache.set('babyweather:weather:openmeteo:v1:50:14:cs', expected);
        limit.mockResolvedValueOnce({ success: false });

        const response = await weather.fetch(request());

        expect(response.status).toBe(429);
        expect(redisGet).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('invalid provider arrays become a generic 502 and are not cached', async () => {
        fetchMock.mockResolvedValueOnce(Response.json({ hourly: { ...upstream.hourly, apparent_temperature: [] } }));

        const response = await weather.fetch(request());

        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: 'Weather service unavailable' });
        expect(redisSet).not.toHaveBeenCalled();
    });
});
