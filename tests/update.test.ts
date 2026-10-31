import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { latestReleaseUrl, updateNotice, updateTimeoutMs, upgradeCommand } from '../src/update.ts';
import { installedVersion } from '../src/version.ts';

delete process.env.GALICIA_NO_UPDATE_CHECK;

const release = (tag_name: string) => ({ tag_name, draft: false, prerelease: false });
const response = (body: unknown): typeof fetch => async () => Response.json(body);

test('published version differences include exact upgrade command; v prefix normalised', async () => {
  for (const tag of ['v0.2.0', '0.2.0', 'v0.0.9']) {
    const notice = await updateNotice('0.1.0', async (url, options) => {
      assert.equal(url, latestReleaseUrl);
      assert.deepEqual(options?.headers, { Accept: 'application/vnd.github+json', 'User-Agent': 'galicia/0.1.0' });
      assert.ok(options?.signal);
      return Response.json(release(tag));
    });
    assert.match(notice!, /Installed: 0\.1\.0/);
    assert.ok(notice!.endsWith(upgradeCommand));
  }
  assert.equal(await updateNotice('0.1.0', response(release('v0.1.0'))), null);
  assert.equal(await updateNotice('0.1.0', response(release('0.1.0'))), null);
});

test('unavailable, malformed, draft and prerelease versions stay silent', async () => {
  for (const body of [null, [], {}, { ...release('v0.2.0'), draft: true }, { ...release('v0.2.0'), prerelease: true },
    release('v0.2.0-beta.1'), release('v01.2.0'), release('v0.2.0\nrun bad-command'), release('main')]) {
    assert.equal(await updateNotice('0.1.0', response(body)), null);
  }
  for (const status of [404, 403, 429, 503]) {
    assert.equal(await updateNotice('0.1.0', async () => new Response('', { status })), null);
  }
  assert.equal(await updateNotice('0.1.0', async () => { throw new Error('Offline'); }), null);
  assert.equal(await updateNotice('0.1.0', async () => new Response('{invalid')), null);
  assert.equal(await updateNotice('invalid', async () => { throw new Error('Must not fetch'); }), null);
});

test('opt-out performs no request', async () => {
  const previous = process.env.GALICIA_NO_UPDATE_CHECK;
  process.env.GALICIA_NO_UPDATE_CHECK = '1';
  try {
    let calls = 0;
    assert.equal(await updateNotice('0.1.0', async () => { calls++; return Response.json(release('v0.2.0')); }), null);
    assert.equal(calls, 0);
  } finally {
    if (previous === undefined) delete process.env.GALICIA_NO_UPDATE_CHECK;
    else process.env.GALICIA_NO_UPDATE_CHECK = previous;
  }
});

test('timeout bounds both unresponsive fetch and response body; request aborted', async () => {
  for (const hangsInBody of [false, true]) {
    let signal: AbortSignal | null | undefined;
    const start = performance.now();
    const notice = await updateNotice('0.1.0', async (_url, options) => {
      signal = options?.signal;
      if (!hangsInBody) return await new Promise<Response>(() => {});
      return new Response(new ReadableStream({ start() {} }));
    });
    assert.equal(notice, null);
    assert.equal(signal?.aborted, true);
    assert.ok(performance.now() - start < updateTimeoutMs + 1_000);
  }
});

test('CLI prints notice on stderr after setup; offline help/version and dry-run write nothing', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'galicia-update-test-'));
  try {
    const project = join(temporary, 'project with spaces');
    await mkdir(project);
    const version = await installedVersion();
    const available = version === '0.2.0' ? '0.2.1' : '0.2.0';
    const mock = join(temporary, 'fetch.mjs');
    await writeFile(mock, `globalThis.fetch = async () => Response.json(${JSON.stringify(release(`v${available}`))});`);
    const cli = resolve('src/cli.ts');
    const run = (args: string[], offline = false) => spawnSync(process.execPath, ['--import', pathToFileURL(mock).href, cli, ...args], {
      cwd: project, encoding: 'utf8', env: { ...process.env, GALICIA_NO_UPDATE_CHECK: offline ? '1' : '0' },
    });
    const preview = run(['init', '--agents', 'codex', '--dry-run']);
    assert.equal(preview.status, 0, preview.stderr);
    assert.match(preview.stdout, /Preview only/);
    assert.match(preview.stderr, /Upgrade: brew update && brew upgrade mrlemoos\/galicia\/galicia/);
    assert.deepEqual(await readdir(project), []);
    const setup = run(['init', '--agents', 'codex', '--yes']);
    assert.equal(setup.status, 0, setup.stderr);
    assert.match(setup.stdout, /Galicia ready/);
    assert.ok(setup.stderr.includes(`${available} available`));
    const check = run(['check']);
    assert.equal(check.status, 0, check.stderr);
    assert.ok(check.stderr.includes(`${available} available`));
    assert.equal(run(['check'], true).stderr, '');
    await writeFile(mock, 'globalThis.fetch = () => { console.error("Unexpected request"); throw Error("Unexpected request"); };');
    for (const args of [['--help'], ['--version'], []]) {
      const result = run(args);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stderr, '');
      if (args[0] === '--version') assert.equal(result.stdout.trim(), version);
    }
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
