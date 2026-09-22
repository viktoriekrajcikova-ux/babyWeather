import { supabaseServer } from '../server/supabase';
import { getWeather } from '../server/weather';
import { weatherRateLimit } from '../server/rateLimit';

export default {
    async fetch(request: Request) {
        if (request.method !== 'GET') {
            return Response.json(
                { error: 'Method not allowed' },
                { status: 405, headers: { Allow: 'GET' } },
            );
        }
        const authorization = request.headers.get('Authorization');
        if (!authorization) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const parts = authorization.trim().split(/\s+/);
        const [scheme, token] = parts;
        if (parts.length !== 2 || scheme.toLowerCase() !== 'bearer' || !token) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        let userId: string;
        try {
            const { data, error } = await supabaseServer.auth.getUser(token);
            if (
                error &&
                (
                    error.status === undefined ||
                    error.status === 0 ||
                    error.status === 429 ||
                    error.status >= 500
                )
            ) {
                return Response.json(
                    { error: 'Authentication service unavailable' },
                    { status: 503, headers: { 'Cache-Control': 'no-store' } },
                );
            }
            if (error || !data.user) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
            userId = data.user.id;
        } catch {
            return Response.json(
                { error: 'Authentication service unavailable' },
                { status: 503, headers: { 'Cache-Control': 'no-store' } },
            );
        }
        const url = new URL(request.url);
        const latInput = url.searchParams.get('lat');
        const lonInput = url.searchParams.get('lon');
        if (!latInput?.trim() || !lonInput?.trim()) {
            return Response.json(
                { error: 'Missing coordinates' },
                { status: 400 },
            );
        }
        const lat = Number(latInput);
        const lon = Number(lonInput);
        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon) ||
            lat < -90 || lat > 90 ||
            lon < -180 || lon > 180
        ) {
            return Response.json(
                { error: 'Invalid coordinates' },
                { status: 400 },
            );
        }
        try {
            const result = await weatherRateLimit.limit(userId);

            if (result.reason === 'timeout') {
                throw new Error('Rate limit check timed out');
            }

            if (!result.success) {
                return Response.json(
                    { error: 'Too many requests' },
                    { status: 429, headers: { 'Cache-Control': 'no-store' } },
                );
            }
        } catch {
            return Response.json(
                { error: 'Rate limit service unavailable' },
                { status: 503, headers: { 'Cache-Control': 'no-store' } },
            );
        }

        try {
            const weather = await getWeather(lat, lon);
            return Response.json(weather, {
                status: 200,
                headers: { 'Cache-Control': 'no-store' },
            });
            } catch {
                return Response.json(
                { error: 'Weather service unavailable' },
                { status: 502, headers: { 'Cache-Control': 'no-store' } },
            );
        }
    }
}