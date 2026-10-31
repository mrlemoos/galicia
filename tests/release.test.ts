import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildRelease } from '../scripts/release.ts';
import { installedVersion } from '../src/version.ts';

test('release packages relocatable CLI/assets; checksum and formula agree; runtime needs no dependencies', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'galicia-release-test-'));
  try {
    const version = await installedVersion();
    const output = join(temporary, 'release');
    await assert.rejects(buildRelease(output, 'v99.0.0'), /Tag must match/);
    await buildRelease(output, `v${version}`);
    const archiveName = `galicia-${version}.tar.gz`;
    const sha256 = createHash('sha256').update(await readFile(join(output, archiveName))).digest('hex');
    assert.equal(await readFile(join(output, 'SHA256SUMS'), 'utf8'), `${sha256}  ${archiveName}\n`);
    const formula = await readFile(join(output, 'galicia.rb'), 'utf8');
    assert.ok(formula.includes(`sha256 "${sha256}"`));
    assert.ok(formula.includes(`/v${version}/${archiveName}`));
    assert.match(formula, /depends_on "node"/);
    assert.match(formula, /"\$@"/);
    const unpack = join(temporary, 'unpacked with spaces');
    await mkdir(unpack);
    assert.equal(spawnSync('tar', ['-xzf', join(output, archiveName), '-C', unpack]).status, 0);
    const source = join(unpack, `galicia-${version}`);
    const contents = await readdir(source);
    assert.deepEqual(contents.sort(), ['LICENSE', 'NOTICE.md', 'README.md', 'breakdown', 'find-rc', 'package.json', 'rubberduck', 'spec', 'src', 'templates', 'terse']);
    const project = join(temporary, 'project with spaces');
    await mkdir(project);
    const args = ['init', '--agents', 'codex,claude,cursor,grok', '--hooks', '--yes'];
    const run = (args: string[]) => spawnSync(process.execPath, [join(source, 'src/cli.ts'), ...args], {
      cwd: project, encoding: 'utf8', env: { ...process.env, GALICIA_NO_UPDATE_CHECK: '1' },
    });
    assert.equal(run(['--version']).stdout.trim(), version);
    const setup = run(args);
    assert.equal(setup.status, 0, setup.stderr);
    assert.match(setup.stdout, /Galicia ready/);
    assert.match(run(args).stdout, /Already initialised/);
    assert.equal(await readFile(join(project, '.agents/skills/terse/SKILL.md'), 'utf8'), await readFile(resolve('terse/SKILL.md'), 'utf8'));
    assert.match(await readFile(join(project, '.galicia/prompts/spec.md'), 'utf8'), /# Spec/);
    assert.equal(run(['check']).status, 0);
    assert.equal(spawnSync(process.execPath, [join(project, '.galicia/check.ts')]).status, 0);
    await writeFile(join(project, '.agents/skills/terse/SKILL.md'), 'Custom.');
    assert.equal(run(args).status, 1);
    assert.equal(await readFile(join(project, '.agents/skills/terse/SKILL.md'), 'utf8'), 'Custom.');
    await assert.rejects(buildRelease(output, `v${version}`), /must be empty/);
    assert.equal(createHash('sha256').update(await readFile(join(output, archiveName))).digest('hex'), sha256);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
