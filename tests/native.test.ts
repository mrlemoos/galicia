import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const binary = process.env.GALICIA_NATIVE_CLI;

test('native CLI matches Node setup, rerun, conflicts and checker', { skip: !binary }, async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'galicia-native-test-'));
  try {
    const nativeRoot = join(temporary, 'native');
    const nodeRoot = join(temporary, 'node');
    const cli = resolve('src/cli.ts');
    const args = ['init', '--agents', 'codex,claude,cursor,grok', '--hooks', '--yes'];
    for (const root of [nativeRoot, nodeRoot]) await mkdir(root);
    const native = (args: string[]) => spawnSync(binary!, args, { encoding: 'utf8' });
    const run = native([...args, '--project', nativeRoot]);
    assert.equal(run.status, 0, run.stderr);
    const node = spawnSync(process.execPath, [cli, ...args, '--project', nodeRoot], { encoding: 'utf8' });
    assert.equal(node.status, 0, node.stderr);
    async function compare(path: string): Promise<void> {
      const entries = await readdir(join(nodeRoot, path), { withFileTypes: true });
      assert.deepEqual((await readdir(join(nativeRoot, path))).sort(), entries.map(e => e.name).sort());
      for (const entry of entries) {
        const child = join(path, entry.name);
        if (entry.isDirectory()) await compare(child);
        else assert.equal(await readFile(join(nativeRoot, child), 'utf8'), await readFile(join(nodeRoot, child), 'utf8'), child);
      }
    }
    await compare('');
    assert.match(native([...args, '--project', nativeRoot]).stdout, /Already initialised/);
    await writeFile(join(nativeRoot, '.agents/skills/terse/SKILL.md'), 'Custom.');
    const conflict = native([...args, '--project', nativeRoot]);
    assert.equal(conflict.status, 1);
    assert.match(conflict.stderr, /Conflicting files/);
    assert.equal(await readFile(join(nativeRoot, '.agents/skills/terse/SKILL.md'), 'utf8'), 'Custom.');
    await writeFile(join(nativeRoot, 'docs/specs/done.md'), 'Status: complete\n- [ ] Pending\n');
    const check = native(['check', '--project', nativeRoot]);
    assert.equal(check.status, 0, check.stderr);
    assert.match(check.stdout, /unchecked acceptance/);
    assert.equal(native(['init', '--agents', 'bogus', '--yes', '--project', nativeRoot]).status, 1);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
