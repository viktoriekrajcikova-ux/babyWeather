// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import weather from './weather';

const { getUser, getWeather, limit } = vi.hoisted(() => ({
    getUser: vi.fn(), getWeather: vi.fn(), limit: vi.fn(),
}));

vi.mock('../server/rateLimit', () => ({ weatherRateLimit: { limit } }));

const weatherData = {
    hourly: [{
        temp: 285.5,
        feels_like: 283.2,
        dt: 1700000000,
        weather: [{ description: 'jasno', icon: '01d' }],
    }],
};

vi.mock('../server/weather', () => ({ getWeather }));

vi.mock('../server/supabase', () => ({
    supabaseServer: { auth: { getUser } },
}));

describe('weather – ověření požadavku', () => {
    beforeEach(() => {
        limit.mockReset().mockResolvedValue({ success: true });
        getWeather.mockReset().mockResolvedValue(weatherData);
        getUser.mockReset().mockResolvedValue({
            data: { user: { id: 'user-A' } },
            error: null,
        });
    });

    it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'])(
        '%s vrátí 405 bez ověřování uživatele',
        async (method) => {
            const request = new Request('https://example.test/api/weather', {
                method,
                headers: { Authorization: 'Bearer test-token' },
            });

            const response = await weather.fetch(request);

            expect(response.status).toBe(405);
            expect(response.headers.get('Allow')).toBe('GET');
            expect(await response.json()).toEqual({ error: 'Method not allowed' });
            expect(getUser).not.toHaveBeenCalled();
        },
    );

    it('bez Authorization vrátí 401', async () => {
        const request = new Request('https://example.test/api/weather');

        const response = await weather.fetch(request);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
        expect(getUser).not.toHaveBeenCalled();
    });

    it.each([
        { name: 'prázdná hlavička', authorization: '' },
        { name: 'pouze mezery', authorization: '   ' },
        { name: 'Bearer bez tokenu', authorization: 'Bearer' },
        { name: 'Bearer s mezerami bez tokenu', authorization: 'Bearer   ' },
        { name: 'jiné schéma', authorization: 'Basic test-token' },
        { name: 'další část navíc', authorization: 'Bearer test-token extra' },
    ])('$name vrátí 401', async ({ authorization }) => {
        const request = new Request('https://example.test/api/weather', {
            headers: { Authorization: authorization },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
        expect(getUser).not.toHaveBeenCalled();
    });

    it.each([
        { name: 'standardní Bearer', authorization: 'Bearer test-token' },
        { name: 'malá písmena', authorization: 'bearer test-token' },
        { name: 'smíšená velikost písmen', authorization: 'bEaReR test-token' },
        { name: 'více mezer', authorization: 'Bearer   test-token' },
        { name: 'okolní mezery', authorization: '  Bearer test-token  ' },
    ])('$name po úspěšném ověření vrátí počasí', async ({ authorization }) => {
        const request = new Request('https://example.test/api/weather?lat=50.08&lon=14.43', {
            headers: { Authorization: authorization },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(weatherData);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(getWeather).toHaveBeenCalledTimes(1);
        expect(getWeather).toHaveBeenCalledWith(50.08, 14.43);
        expect(getUser).toHaveBeenCalledTimes(1);
        expect(getUser).toHaveBeenCalledWith('test-token');
    });

    it.each([
        { name: 'obě chybějí', query: '' },
        { name: 'chybí lat', query: 'lon=14.43' },
        { name: 'chybí lon', query: 'lat=50.08' },
        { name: 'prázdná lat', query: 'lat=&lon=14.43' },
        { name: 'prázdná lon', query: 'lat=50.08&lon=' },
        { name: 'mezery v lat', query: 'lat=%20%20&lon=14.43' },
        { name: 'mezery v lon', query: 'lat=50.08&lon=%20%20' },
    ])('$name vrátí Missing coordinates', async ({ query }) => {
        const request = new Request(`https://example.test/api/weather?${query}`, {
            headers: { Authorization: 'Bearer test-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Missing coordinates' });
        expect(limit).not.toHaveBeenCalled();
        expect(getWeather).not.toHaveBeenCalled();
        expect(getUser).toHaveBeenCalledWith('test-token');
    });

    it.each([
        { lat: 'abc', lon: '14.43' },
        { lat: '50.08', lon: 'abc' },
        { lat: 'NaN', lon: '14.43' },
        { lat: '50.08', lon: 'NaN' },
        { lat: 'Infinity', lon: '14.43' },
        { lat: '50.08', lon: 'Infinity' },
        { lat: '-Infinity', lon: '14.43' },
        { lat: '50.08', lon: '-Infinity' },
        { lat: '-90.001', lon: '0' },
        { lat: '90.001', lon: '0' },
        { lat: '0', lon: '-180.001' },
        { lat: '0', lon: '180.001' },
    ])('lat=$lat, lon=$lon vrátí Invalid coordinates', async ({ lat, lon }) => {
        const query = new URLSearchParams({ lat, lon });
        const request = new Request(`https://example.test/api/weather?${query}`, {
            headers: { Authorization: 'Bearer test-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Invalid coordinates' });
        expect(limit).not.toHaveBeenCalled();
        expect(getWeather).not.toHaveBeenCalled();
    });

    it.each([
        { lat: '0', lon: '0' },
        { lat: '-90', lon: '-180' },
        { lat: '90', lon: '180' },
        { lat: '50.08', lon: '14.43' },
        { lat: '-33.87', lon: '-70.66' },
        { lat: ' 50.08 ', lon: ' 14.43 ' },
    ])('platné lat=$lat, lon=$lon předá jako čísla službě počasí', async ({ lat, lon }) => {
        const query = new URLSearchParams({ lat, lon });
        const request = new Request(`https://example.test/api/weather?${query}`, {
            headers: { Authorization: 'Bearer test-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(weatherData);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(getWeather).toHaveBeenCalledTimes(1);
        expect(getWeather).toHaveBeenCalledWith(Number(lat), Number(lon));
    });

    it('limituje ověřené ID, nikoli ID dodané klientem', async () => {
        const request = new Request('https://example.test/api/weather?lat=0&lon=0&userId=forged-user', {
            headers: { Authorization: 'Bearer test-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(weatherData);
        expect(limit).toHaveBeenCalledTimes(1);
        expect(limit).toHaveBeenCalledWith('user-A');
        expect(getUser.mock.invocationCallOrder[0]).toBeLessThan(limit.mock.invocationCallOrder[0]);
        expect(limit.mock.invocationCallOrder[0]).toBeLessThan(getWeather.mock.invocationCallOrder[0]);
    });

    it('překročený limit vrátí 429 bez načítání počasí', async () => {
        limit.mockResolvedValueOnce({ success: false });
        const request = new Request('https://example.test/api/weather?lat=0&lon=0', {
            headers: { Authorization: 'Bearer test-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(429);
        expect(await response.json()).toEqual({ error: 'Too many requests' });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(limit).toHaveBeenCalledWith('user-A');
        expect(getWeather).not.toHaveBeenCalled();
    });

    it.each([true, false])('timeout limiteru vrátí 503 i při success=%s', async success => {
        limit.mockResolvedValueOnce({ success, reason: 'timeout' });
        const request = new Request('https://example.test/api/weather?lat=0&lon=0', {
            headers: { Authorization: 'Bearer test-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ error: 'Rate limit service unavailable' });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(getWeather).not.toHaveBeenCalled();
    });

    it('výjimka limiteru vrátí obecnou 503 a počasí nenačítá', async () => {
        limit.mockRejectedValueOnce(new Error('Internal Redis detail'));
        const request = new Request('https://example.test/api/weather?lat=0&lon=0', {
            headers: { Authorization: 'Bearer test-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ error: 'Rate limit service unavailable' });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(getWeather).not.toHaveBeenCalled();
    });

    it.each([undefined, 0, 429, 500, 502, 503, 504])(
        'vrácená provozní chyba auth se statusem %s znamená 503',
        async status => {
            getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Internal authentication detail', status },
            });
            const request = new Request('https://example.test/api/weather?lat=50.08&lon=14.43', {
                headers: { Authorization: 'Bearer test-token' },
            });

            const response = await weather.fetch(request);

            expect(response.status).toBe(503);
            expect(await response.json()).toEqual({ error: 'Authentication service unavailable' });
            expect(response.headers.get('Cache-Control')).toBe('no-store');
            expect(getUser).toHaveBeenCalledTimes(1);
            expect(getUser).toHaveBeenCalledWith('test-token');
            expect(getWeather).not.toHaveBeenCalled();
        },
    );

    it('při výjimce ověřování vrátí obecnou 503 a počasí nenačítá', async () => {
        getUser.mockRejectedValueOnce(new Error('Internal authentication detail'));
        const request = new Request('https://example.test/api/weather?lat=50.08&lon=14.43', {
            headers: { Authorization: 'Bearer test-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ error: 'Authentication service unavailable' });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(getUser).toHaveBeenCalledTimes(1);
        expect(getUser).toHaveBeenCalledWith('test-token');
        expect(getWeather).not.toHaveBeenCalled();
    });

    it('při selhání počasí vrátí obecnou 502 bez interní zprávy', async () => {
        getWeather.mockRejectedValueOnce(new Error('Internal upstream detail test-only-key'));
        const request = new Request('https://example.test/api/weather?lat=50.08&lon=14.43', {
            headers: { Authorization: 'Bearer test-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: 'Weather service unavailable' });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(getWeather).toHaveBeenCalledTimes(1);
        expect(getWeather).toHaveBeenCalledWith(50.08, 14.43);
    });

    it.each([
        { name: 'bez přihlášení', method: 'GET', authorization: null, expectedStatus: 401 },
        { name: 'chybná hlavička', method: 'GET', authorization: 'Basic test-token', expectedStatus: 401 },
        { name: 'neplatný token', method: 'GET', authorization: 'Bearer invalid-token', expectedStatus: 401 },
        { name: 'nepodporovaná metoda', method: 'POST', authorization: 'Bearer test-token', expectedStatus: 405 },
    ])('$name nesmí spustit načítání počasí ani s platnými souřadnicemi', async ({ method, authorization, expectedStatus }) => {
        getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token', status: 401 } });
        const headers = new Headers();
        if (authorization !== null) headers.set('Authorization', authorization);
        const request = new Request('https://example.test/api/weather?lat=50.08&lon=14.43', {
            method,
            headers,
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(expectedStatus);
        expect(limit).not.toHaveBeenCalled();
        expect(getWeather).not.toHaveBeenCalled();
    });

    it.each([400, 401, 403])('při odmítnutí tokenu se statusem %s vrátí 401 bez interních podrobností', async status => {
        getUser.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'Internal token verification detail', status },
        });
        const request = new Request('https://example.test/api/weather?lat=50.08&lon=14.43', {
            headers: { Authorization: 'Bearer invalid-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
        expect(getUser).toHaveBeenCalledTimes(1);
        expect(getUser).toHaveBeenCalledWith('invalid-token');
        expect(getWeather).not.toHaveBeenCalled();
    });

    it('bez vráceného uživatele odmítne požadavek i bez chyby', async () => {
        getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
        const request = new Request('https://example.test/api/weather', {
            headers: { Authorization: 'Bearer test-token' },
        });

        const response = await weather.fetch(request);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
        expect(getUser).toHaveBeenCalledTimes(1);
        expect(getUser).toHaveBeenCalledWith('test-token');
    });
});
