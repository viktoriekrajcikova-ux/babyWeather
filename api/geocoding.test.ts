// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import geocoding from './geocoding';
const { getUser, getGeocoding, limit } = vi.hoisted(() => ({ getUser: vi.fn(), getGeocoding: vi.fn(), limit: vi.fn() }));
vi.mock('../server/supabase', () => ({ supabaseServer: { auth: { getUser } } }));
vi.mock('../server/geocoding', () => ({ getGeocoding }));
vi.mock('../server/geocodingRateLimit', () => ({ geocodingRateLimit: { limit } }));
const place = { name: 'Praha', country: 'CZ', lat: 50.08, lon: 14.43 };
function request(query = 'city=Praha', authorization: string | null = 'Bearer test-token', method = 'GET') {
    const headers = new Headers();
    if (authorization !== null) headers.set('Authorization', authorization);
    return new Request(`https://example.test/api/geocoding?${query}`, { method, headers });
}
async function expectError(response: Response, status: number, error: string) {
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
}
describe('geocoding endpoint', () => {
    beforeEach(() => {
        getUser.mockReset().mockResolvedValue({ data: { user: { id: 'verified-user' } }, error: null });
        getGeocoding.mockReset().mockResolvedValue(place);
        limit.mockReset().mockResolvedValue({ success: true });
    });
    it.each(['  Praha  ', 'České Budějovice', 'Ab', 'x'.repeat(100)])('returns place for trimmed city %s after verifying and limiting the user', async city => {
        const response = await geocoding.fetch(request(new URLSearchParams({ city }).toString(), 'bEaReR   test-token'));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(place);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(getUser).toHaveBeenCalledWith('test-token');
        expect(limit).toHaveBeenCalledWith('verified-user');
        expect(getGeocoding).toHaveBeenCalledWith(city.trim());
        expect(getUser.mock.invocationCallOrder[0]).toBeLessThan(limit.mock.invocationCallOrder[0]);
        expect(limit.mock.invocationCallOrder[0]).toBeLessThan(getGeocoding.mock.invocationCallOrder[0]);
    });
    it.each([true, false])('fails closed for limiter timeout with success=%s', async success => {
        limit.mockResolvedValueOnce({ success, reason: 'timeout' });
        await expectError(await geocoding.fetch(request()), 503, 'Rate limit service unavailable');
        expect(getGeocoding).not.toHaveBeenCalled();
    });
    it('fails closed on limiter rejection', async () => {
        limit.mockRejectedValueOnce(new Error('private redis detail'));
        await expectError(await geocoding.fetch(request()), 503, 'Rate limit service unavailable');
        expect(getGeocoding).not.toHaveBeenCalled();
    });
    it('rejects over-limit requests', async () => {
        limit.mockResolvedValueOnce({ success: false });
        await expectError(await geocoding.fetch(request()), 429, 'Too many requests');
        expect(getGeocoding).not.toHaveBeenCalled();
    });
    it('returns 404 for no result', async () => {
        getGeocoding.mockResolvedValueOnce(null);
        await expectError(await geocoding.fetch(request()), 404, 'Location not found');
    });
    it('sanitizes upstream and cache failures', async () => {
        getGeocoding.mockRejectedValueOnce(new Error('private provider detail'));
        await expectError(await geocoding.fetch(request()), 502, 'Geocoding service unavailable');
    });
    it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'])('rejects method %s before auth', async method => {
        const response = await geocoding.fetch(request('city=Praha', null, method));
        await expectError(response, 405, 'Method not allowed');
        expect(response.headers.get('Allow')).toBe('GET');
        expect(getUser).not.toHaveBeenCalled();
    });
    it.each(['', 'city=', 'city=%20%20', 'city=x', `city=${'x'.repeat(101)}`, 'city=Praha&city=Brno',
        'city[]=Praha', 'city=Praha&extra=value', 'city=Praha%00', 'city=%FF', 'city=Praha%2', 'city=Praha%0A'])('rejects invalid query %s', async query => {
        await expectError(await geocoding.fetch(request(query)), 400, 'Invalid city');
        expect(limit).not.toHaveBeenCalled();
        expect(getGeocoding).not.toHaveBeenCalled();
    });
    it.each([400, 401, 403, undefined, 0, 429, 500, 503])('classifies auth error status %s', async status => {
        getUser.mockResolvedValueOnce({ data: { user: null }, error: { status, message: 'private detail' } });
        const unavailable = status === undefined || status === 0 || status === 429 || status >= 500;
        await expectError(await geocoding.fetch(request()), unavailable ? 503 : 401,
            unavailable ? 'Authentication service unavailable' : 'Unauthorized');
        expect(getUser).toHaveBeenCalledWith('test-token');
        expect(limit).not.toHaveBeenCalled();
        expect(getGeocoding).not.toHaveBeenCalled();
    });
    it('rejects a missing user even without an auth error', async () => {
        getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
        await expectError(await geocoding.fetch(request()), 401, 'Unauthorized');
    });
    it('sanitizes thrown auth failures', async () => {
        getUser.mockRejectedValueOnce(new Error('private auth detail'));
        await expectError(await geocoding.fetch(request()), 503, 'Authentication service unavailable');
        expect(limit).not.toHaveBeenCalled();
    });
    it.each([null, '', 'Basic token', 'Bearer', 'Bearer token extra'])('rejects invalid authorization %s', async authorization => {
        await expectError(await geocoding.fetch(request('city=Praha', authorization)), 401, 'Unauthorized');
        expect(getUser).not.toHaveBeenCalled();
        expect(getGeocoding).not.toHaveBeenCalled();
        expect(limit).not.toHaveBeenCalled();
    });
});
