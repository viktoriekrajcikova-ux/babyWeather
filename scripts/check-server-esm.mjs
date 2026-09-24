import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

// Keep node_modules reachable, but never load real environment files.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = await mkdtemp(path.join(root, '.server-esm-check-'));

async function transpileDirectory(directory) {
  await mkdir(path.join(output, directory), { recursive: true });
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await transpileDirectory(relativePath);
      continue;
    }
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) continue;
    const source = await readFile(path.join(root, relativePath), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
      fileName: entry.name,
    });
    await writeFile(path.join(output, relativePath.replace(/\.ts$/, '.js')), outputText);
  }
}

try {
  await writeFile(path.join(output, 'package.json'), '{"type":"module"}');
  for (const directory of ['api', 'server']) {
    await transpileDirectory(directory);
  }
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
        import assert from 'node:assert/strict';
        globalThis.fetch = async () => { throw new Error('Unexpected network request'); };
        for (const endpoint of ['weather', 'geocoding']) {
            const { default: handler } = await import('./api/' + endpoint + '.js');
            const response = await handler.fetch(new Request('https://example.test/api/' + endpoint));
            assert.equal(response.status, 401);
            assert.deepEqual(await response.json(), { error: 'Unauthorized' });
            console.log(endpoint + ': native Node ESM import and unauthenticated 401 passed');
        }
    `,
    ],
    {
      cwd: output,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_OPTIONS: '',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
      },
    },
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status, 0, 'Compiled server endpoints must load in native Node ESM');
} finally {
  await rm(output, { recursive: true, force: true });
}
