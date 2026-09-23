import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';

function validateConfig(urlInput, keyInput) {
    const url = new URL(urlInput.trim());
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') ||
        url.username || url.password || url.search || url.hash || url.pathname !== '/') {
        throw new Error('Pouzij zakladni HTTPS adresu projektu: https://PROJECT.supabase.co');
    }
    const key = keyInput.trim();
    if (key.startsWith('sb_publishable_') && key.length > 20) {
        return { url, key, legacy: false };
    }
    try {
        const parts = key.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        if (parts.length === 3 && payload.role === 'anon') {
            return { url, key, legacy: true };
        }
    } catch {
        // Never include the supplied key in an error message.
    }
    throw new Error('Pouzij pouze verejny anon nebo sb_publishable_ klic. Ne service_role, secret ani uzivatelsky token.');
}

async function checkAnonymous(config, fetchRequest = fetch) {
    const endpoint = new URL('/rest/v1/children', config.url);
    endpoint.searchParams.set('select', 'id');
    endpoint.searchParams.set('limit', '1');
    const headers = { apikey: config.key, Accept: 'application/json' };
    // A legacy anon JWT identifies the anonymous role, not a signed-in user.
    if (config.legacy) headers.Authorization = `Bearer ${config.key}`;
    let response;
    try {
        response = await fetchRequest(endpoint, {
            method: 'GET', headers, redirect: 'error', signal: AbortSignal.timeout(15000),
        });
    } catch {
        return { code: 2, message: 'NEOVERENO: sitova chyba nebo timeout. Zadna data nebyla vypsana.' };
    }
    if (!response.ok) {
        return { code: 2, message: `NEOVERENO: HTTP ${response.status}. Odmitnuti muze znamenat opravneni i chybnou konfiguraci; nejde o potvrzeni RLS.` };
    }
    let data;
    try {
        data = await response.json();
    } catch {
        return { code: 2, message: 'NEOVERENO: odpoved neni platny JSON.' };
    }
    if (!Array.isArray(data)) {
        return { code: 2, message: 'NEOVERENO: neocekavany format odpovedi.' };
    }
    if (data.length > 0) {
        return { code: 1, message: 'SELHANI: neprihlaseny pozadavek precetl zaznam z children. Obsah nebyl vypsan.' };
    }
    return { code: 0, message: 'PRAZDNY VYSLEDEK: neprihlaseny pozadavek nevidi zadne deti. Over, ze jde o stejny projekt, kde existuji Test A a Test B. Toto netestuje zapis ani pristup mezi ucty.' };
}

async function selfTest() {
    const config = validateConfig('https://example.supabase.co', 'sb_publishable_test_only_not_real');
    const outcomes = [
        [200, [], 0], [200, [{ id: 'fictional-test-row' }], 1],
        [401, {}, 2], [403, {}, 2], [500, {}, 2], [200, {}, 2],
    ];
    for (const [status, body, expected] of outcomes) {
        const result = await checkAnonymous(config, async (url, options) => {
            assert.equal(url.pathname, '/rest/v1/children');
            assert.equal(url.searchParams.get('select'), 'id');
            assert.equal(url.searchParams.get('limit'), '1');
            assert.equal(options.method, 'GET');
            assert.equal(options.headers.Authorization, undefined);
            assert.equal(options.redirect, 'error');
            return new Response(JSON.stringify(body), { status });
        });
        assert.equal(result.code, expected);
        assert.ok(!result.message.includes('fictional-test-row'));
    }
    assert.equal((await checkAnonymous(config, async () => { throw new Error('offline'); })).code, 2);
    assert.equal((await checkAnonymous(config, async () => new Response('invalid json'))).code, 2);
    const jwt = role => `test.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.test`;
    assert.throws(() => validateConfig('https://example.supabase.co', jwt('service_role')));
    assert.throws(() => validateConfig('https://example.supabase.co', jwt('authenticated')));
    assert.throws(() => validateConfig('https://example.supabase.co', 'sb_secret_test'));
    assert.throws(() => validateConfig('https://example.supabase.co/path', config.key));
    const legacy = validateConfig('https://example.supabase.co', jwt('anon'));
    await checkAnonymous(legacy, async (_url, options) => {
        assert.equal(options.headers.Authorization, `Bearer ${legacy.key}`);
        return new Response('[]');
    });
    console.log('SELF-TEST OK: lokalni simulace, zadne sitove pozadavky. Zive RLS nebylo testovano.');
}

async function main() {
    if (process.argv.includes('--self-test')) return selfTest();
    console.log('Pouze cteni children bez prihlaseni. Nic se nemeni ani neuklada.');
    console.log('Zadej verejny anon/publishable klic, NIKOLI secret/service_role ani uzivatelsky token.');
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    let config;
    try {
        const url = await terminal.question('Supabase Project URL: ');
        const key = await terminal.question('Verejny anon/publishable klic (vstup je viditelny): ');
        config = validateConfig(url, key);
    } finally {
        terminal.close();
    }
    const result = await checkAnonymous(config);
    console.log(result.message);
    process.exitCode = result.code;
}

main().catch(() => {
    console.error('NEOVERENO: zkontroluj adresu projektu a verejny anon/publishable klic. Podrobnosti jsou zamerne skryte.');
    process.exitCode = 2;
});
