// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGeocoding } from './geocoding';

const { redisGet, redisSet } = vi.hoisted(() => ({ redisGet: vi.fn(), redisSet: vi.fn() }));
vi.mock('./redis', () => ({ redis: { get: redisGet, set: redisSet } }));
const fetchMock = vi.fn<typeof fetch>();
const place = { name: 'Praha', country: 'CZ', lat: 50.08, lon: 14.43 };
const upstream = { results: [{ name: 'Praha', country: 'Česko', country_code: 'CZ', latitude: 50.08, longitude: 14.43, id: 1 }] };

describe('getGeocoding', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock);
        fetchMock.mockReset().mockResolvedValue(Response.json(upstream));
        redisGet.mockReset().mockResolvedValue(null);
        redisSet.mockReset().mockResolvedValue('OK');
    });
    afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

    it('caches only the mapped result for one day and reuses validated cached values', async () => {
        await expect(getGeocoding('  Praha  ')).resolves.toEqual(place);
        expect(redisGet).toHaveBeenCalledWith('babyweather:geocoding:open-meteo:v1:cs:Praha');
        expect(redisSet).toHaveBeenCalledWith('babyweather:geocoding:open-meteo:v1:cs:Praha', place, { ex: 86400 });
        redisGet.mockResolvedValueOnce({ ...place, extra: 'not returned' });
        await expect(getGeocoding('Praha')).resolves.toEqual(place);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(redisSet).toHaveBeenCalledTimes(1);
    });

    it.each([{ body: {} }, { body: { results: [] } }])('returns null for no results without caching: $body', async ({ body }) => {
        fetchMock.mockResolvedValueOnce(Response.json(body));
        await expect(getGeocoding('Unknown')).resolves.toBeNull();
        expect(redisSet).not.toHaveBeenCalled();
    });

    it.each([400, 404, 429, 500])('rejects upstream HTTP %s without caching', async status => {
        fetchMock.mockResolvedValueOnce(Response.json(upstream, { status }));
        await expect(getGeocoding('Praha')).rejects.toThrow('Geocoding service request failed');
        expect(redisSet).not.toHaveBeenCalled();
    });

    it('configures a separate 20-per-minute geocoding limiter', async () => {
        const slidingWindow = vi.fn().mockReturnValue('window');
        const constructor = vi.fn();
        vi.doMock('@upstash/ratelimit', () => ({ Ratelimit: class {
            static slidingWindow = slidingWindow;
            constructor(options: unknown) { constructor(options); }
        } }));
        try {
            await import('./geocodingRateLimit');
            expect(slidingWindow).toHaveBeenCalledWith(20, '1 m');
            expect(constructor).toHaveBeenCalledWith({
                redis: { get: redisGet, set: redisSet }, limiter: 'window', analytics: false,
                prefix: 'babyweather:ratelimit:geocoding',
            });
        } finally { vi.doUnmock('@upstash/ratelimit'); }
    });

    it.each([
        { name: 'string latitude', patch: { latitude: '50' } },
        { name: 'latitude outside bounds', patch: { latitude: 91 } },
        { name: 'longitude outside bounds', patch: { longitude: -181 } },
        { name: 'missing country', patch: { country_code: undefined } },
        { name: 'country name rather than ISO', patch: { country_code: 'Česko' } },
        { name: 'blank name', patch: { name: ' ' } },
    ])('rejects invalid upstream $name without caching', async ({ patch }) => {
        fetchMock.mockResolvedValueOnce(Response.json({ results: [{ ...upstream.results[0], ...patch }] }));
        await expect(getGeocoding('Praha')).rejects.toThrow();
        expect(redisSet).not.toHaveBeenCalled();
    });

    it.each([{ body: null }, { body: [] }, { body: { results: null } }, { body: { results: {} } }])('rejects malformed payload $body', async ({ body }) => {
        fetchMock.mockResolvedValueOnce(Response.json(body));
        await expect(getGeocoding('Praha')).rejects.toThrow();
        expect(redisSet).not.toHaveBeenCalled();
    });
    it('rejects invalid JSON without caching', async () => {
        fetchMock.mockResolvedValueOnce(new Response('not json'));
        await expect(getGeocoding('Praha')).rejects.toThrow();
        expect(redisSet).not.toHaveBeenCalled();
    });
    it('propagates network failure without caching', async () => {
        fetchMock.mockRejectedValueOnce(new Error('network failure'));
        await expect(getGeocoding('Praha')).rejects.toThrow('network failure');
        expect(redisSet).not.toHaveBeenCalled();
    });
    it('uses the five-second abort signal and does not cache timed-out calls', async () => {
        const controller = new AbortController();
        const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
        fetchMock.mockImplementationOnce((_input, options) => new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true });
        }));
        const operation = getGeocoding('Praha');
        const assertion = expect(operation).rejects.toMatchObject({ name: 'TimeoutError' });
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        expect(timeout).toHaveBeenCalledWith(5000);
        expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
        controller.abort(new DOMException('test timeout', 'TimeoutError'));
        await assertion;
        expect(redisSet).not.toHaveBeenCalled();
    });
    it('replaces invalid cached data', async () => {
        redisGet.mockResolvedValueOnce({ ...place, lat: 91 });
        await expect(getGeocoding('Praha')).resolves.toEqual(place);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(redisSet).toHaveBeenCalledTimes(1);
    });
    it('separates cache entries for distinct cities and encodes key separators', async () => {
        redisGet.mockResolvedValue(place);
        await getGeocoding('Praha');
        await getGeocoding('Brno');
        await getGeocoding('A:B');
        expect(redisGet.mock.calls).toEqual([
            ['babyweather:geocoding:open-meteo:v1:cs:Praha'],
            ['babyweather:geocoding:open-meteo:v1:cs:Brno'],
            ['babyweather:geocoding:open-meteo:v1:cs:A%3AB'],
        ]);
        expect(fetchMock).not.toHaveBeenCalled();
    });
    it('fails closed on Redis reads without contacting upstream', async () => {
        redisGet.mockRejectedValueOnce(new Error('redis read failure'));
        await expect(getGeocoding('Praha')).rejects.toThrow('redis read failure');
        expect(fetchMock).not.toHaveBeenCalled();
        expect(redisSet).not.toHaveBeenCalled();
    });
    it('propagates Redis write failure', async () => {
        redisSet.mockRejectedValueOnce(new Error('redis write failure'));
        await expect(getGeocoding('Praha')).rejects.toThrow('redis write failure');
    });

    it('rejects an upstream error payload even when HTTP status is 200', async () => {
        fetchMock.mockResolvedValueOnce(Response.json({ error: true, reason: 'provider detail' }));
        await expect(getGeocoding('Praha')).rejects.toThrow();
        expect(redisSet).not.toHaveBeenCalled();
    });

    it('maps Open-Meteo coordinates and ISO country to the existing contract', async () => {
        await expect(getGeocoding('Praha')).resolves.toEqual(place);
        const [input, options] = fetchMock.mock.calls[0];
        const url = input as URL;
        expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
        expect(Object.fromEntries(url.searchParams)).toEqual({ name: 'Praha', count: '1', language: 'cs', format: 'json' });
        expect(options?.signal).toBeInstanceOf(AbortSignal);
    });
});
