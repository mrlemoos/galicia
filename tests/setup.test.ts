import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, mkdir, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('piped setup installs pinned archive without Git; download failures return non-zero', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'galicia-bootstrap-test-'));
  try {
    const revision = '050d4835a5e0032230f6a358567771ea3ec4e73d';
    const source = join(temporary, `galicia-${revision}`);
    await mkdir(source);
    for (const path of ['src', 'templates', 'terse', 'rubberduck', 'spec', 'breakdown', 'find-rc', 'LICENSE', 'NOTICE.md', 'package.json']) {
      await cp(resolve(path), join(source, path), { recursive: true });
    }
    const archive = join(temporary, 'source.tar.gz');
    assert.equal(spawnSync('tar', ['-czf', archive, '-C', temporary, `galicia-${revision}`]).status, 0);
    const project = join(temporary, 'project');
    await mkdir(project);
    const script = await readFile('scripts/setup.ts', 'utf8');
    const prefix = `globalThis.fetch = async (url) => { if (!String(url).endsWith('/${revision}')) throw Error('Unpinned URL'); return new Response(await (await import('node:fs/promises')).readFile(${JSON.stringify(archive)})); };\n`;
    const result = spawnSync(process.execPath, ['--input-type=module', '-', '--agents', 'codex', '--yes'], { cwd: project, input: prefix + script, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(await readFile(join(project, '.agents/skills/terse/SKILL.md'), 'utf8'), /terse/);
    const failure = spawnSync(process.execPath, ['--input-type=module', '-', '--yes'], { cwd: project, input: "globalThis.fetch = async () => new Response('', {status: 503});\n" + script, encoding: 'utf8' });
    assert.equal(failure.status, 1);
    assert.match(failure.stderr, /HTTP 503/);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
