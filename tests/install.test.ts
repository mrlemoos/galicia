import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { planInstall, applyPlan, mergeHook, sourceRoot } from '../src/install.ts';
import type { Options } from '../src/install.ts';

process.env.GALICIA_NO_UPDATE_CHECK = '1';

async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'galicia-test-'));
  try { await run(root); } finally { await rm(root, { recursive: true, force: true }); }
}
const options = (project: string): Options => ({ project, agents: ['codex', 'claude', 'cursor', 'grok'], skills: ['terse', 'rubberduck', 'spec', 'breakdown', 'find-rc'], cadence: 'batch', hooks: true });

test('complete setup preserves user context and unrelated hooks; rerun makes no changes', async () => fixture(async root => {
  await mkdir(join(root, '.claude'));
  const userHook = { matcher: 'startup', hooks: [{ type: 'command', command: 'echo existing' }] };
  await writeFile(join(root, '.claude/settings.json'), JSON.stringify({ permissions: { deny: ['Read(.env)'] }, hooks: { SessionStart: [userHook] } }));
  await writeFile(join(root, 'AGENTS.md'), '# User rules\nNever publish.\n');
  await writeFile(join(root, 'context.md'), 'Authoritative context.\n');
  const plan = await planInstall(options(root));
  await applyPlan(plan.root, plan.changes);
  assert.equal(await readFile(join(root, 'context.md'), 'utf8'), 'Authoritative context.\n');
  assert.match(await readFile(join(root, 'AGENTS.md'), 'utf8'), /^# User rules\nNever publish/);
  const config = JSON.parse(await readFile(join(root, '.claude/settings.json'), 'utf8'));
  assert.deepEqual(config.permissions.deny, ['Read(.env)']);
  assert.deepEqual(config.hooks.SessionStart[0], userHook);
  assert.equal(config.hooks.SessionStart.length, 2);
  assert.match(await readFile(join(root, '.galicia/prompts/terse.md'), 'utf8'), /^\n?# Terse/);
  const again = await planInstall(options(root));
  assert.deepEqual(again.changes.filter(c => c.state !== 'same'), []);
}));

test('edited skill conflicts abort entire plan without touching unrelated files', async () => fixture(async root => {
  let plan = await planInstall(options(root));
  await applyPlan(plan.root, plan.changes);
  await writeFile(join(root, '.agents/skills/terse/SKILL.md'), 'User customisation.');
  plan = await planInstall({ ...options(root), cadence: 'one' });
  assert.ok(plan.changes.some(c => c.state === 'conflict'));
  await assert.rejects(applyPlan(plan.root, plan.changes), /Conflicts/);
  assert.equal(JSON.parse(await readFile(join(root, '.galicia/config.json'), 'utf8')).cadence, 'batch');
  assert.equal(await readFile(join(root, '.agents/skills/terse/SKILL.md'), 'utf8'), 'User customisation.');
}));

test('files changed after preview reject writes', async () => fixture(async root => {
  const plan = await planInstall(options(root));
  await writeFile(join(root, 'AGENTS.md'), 'Concurrent change.');
  await assert.rejects(applyPlan(plan.root, plan.changes), /changed after preview/);
  assert.equal(await readFile(join(root, 'AGENTS.md'), 'utf8'), 'Concurrent change.');
}));

test('custom edits inside generated guidance conflict; edits outside remain intact', async () => fixture(async root => {
  const initial = await planInstall(options(root));
  await applyPlan(initial.root, initial.changes);
  const path = join(root, 'AGENTS.md');
  const original = await readFile(path, 'utf8');
  await writeFile(path, `# Extra user rules\n${original}`);
  let plan = await planInstall(options(root));
  assert.equal(plan.changes.find(c => c.path === 'AGENTS.md')!.state, 'same');
  await writeFile(path, original.replace('## Galicia', '## Custom Galicia policy'));
  plan = await planInstall(options(root));
  assert.equal(plan.changes.find(c => c.path === 'AGENTS.md')!.state, 'conflict');
  await assert.rejects(applyPlan(plan.root, plan.changes), /Conflicts/);
  assert.match(await readFile(path, 'utf8'), /Custom Galicia policy/);
}));

test('symlink destinations and malformed hook JSON rejected', async () => fixture(async root => {
  const external = await mkdtemp(join(tmpdir(), 'galicia-outside-'));
  try {
    await symlink(external, join(root, '.galicia'));
    await assert.rejects(planInstall(options(root)), /symlink/);
    assert.throws(() => mergeHook('{invalid', 'claude'));
    assert.throws(() => mergeHook('{"hooks":{"SessionStart":{}}}', 'claude'), /array/);
    assert.throws(() => mergeHook('{"version":2}', 'cursor'), /schema/);
  } finally { await rm(external, { recursive: true, force: true }); }
}));

test('nested symlink in context destination rejected before reading external content', async () => fixture(async root => {
  await mkdir(join(root, 'docs'));
  await symlink('/etc/hosts', join(root, 'docs/Language.md'));
  await assert.rejects(planInstall(options(root)), /symlink/);
}));

test('project type commonjs does not break installed TypeScript checker or hook output', async () => fixture(async root => {
  await writeFile(join(root, 'package.json'), '{"type":"commonjs"}');
  const plan = await planInstall(options(root));
  await applyPlan(plan.root, plan.changes);
  const context = await readFile(join(root, 'context.md'), 'utf8');
  for (const match of context.matchAll(/\]\(([^)]+)\)/g)) await readFile(join(root, match[1]!));
  await writeFile(join(root, 'docs/specs/old.md'), '# Old\nStatus: complete\n- [ ] Verify boundary\n');
  for (const agent of ['codex', 'claude', 'cursor']) {
    const run = spawnSync(process.execPath, [join(root, '.galicia/startup.ts'), agent], { cwd: tmpdir(), encoding: 'utf8', input: '{}' });
    assert.equal(run.status, 0, run.stderr);
    const response = JSON.parse(run.stdout);
    const context = agent === 'cursor' ? response.additional_context : response.hookSpecificOutput.additionalContext;
    assert.match(context, /unchecked acceptance/);
  }
  const manual = spawnSync(process.execPath, [join(root, '.galicia/check.ts')], { encoding: 'utf8' });
  assert.equal(manual.status, 0, manual.stderr);
  assert.match(manual.stdout, /No deletion without explicit approval/);
}));

test('CLI dry-run creates nothing, rejects unknown agents and flags', async () => fixture(async root => {
  const cli = join(sourceRoot, 'src/cli.ts');
  const run = spawnSync(process.execPath, [cli, 'init', '--project', root, '--agents', 'codex', '--dry-run'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /nothing written/);
  await assert.rejects(readFile(join(root, 'AGENTS.md')), { code: 'ENOENT' });
  for (const args of [['init', '--agents', 'bogus', '--yes'], ['init', '--global'], ['check', 'extra']]) {
    const bad = spawnSync(process.execPath, [cli, ...args, '--project', root], { encoding: 'utf8' });
    assert.equal(bad.status, 1);
  }
}));

test('download script rejects mutable refs and unsafe repository strings before fetching', () => {
  for (const args of [['--repo', 'owner/repo', '--ref', 'main'], ['--repo', '../oops', '--ref', 'a'.repeat(40)]]) {
    const run = spawnSync(process.execPath, [join(sourceRoot, 'scripts/download.ts'), ...args], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.doesNotMatch(run.stdout, /downloading/);
  }
});

test('exclusive staging collision preserves foreign file and rolls back earlier writes', async () => fixture(async root => {
  const crypto = (await import('node:crypto')).default;
  const { syncBuiltinESMExports } = await import('node:module');
  const original = crypto.randomUUID;
  const id = '00000000-0000-4000-8000-000000000000';
  const collision = join(root, `second.md.${id}.tmp`);
  await writeFile(collision, 'Foreign staged content.');
  await writeFile(join(root, 'first.md'), 'Before.');
  try {
    crypto.randomUUID = () => id;
    syncBuiltinESMExports();
    await assert.rejects(applyPlan(root, [
      { path: 'first.md', before: 'Before.', after: 'After.', state: 'update' },
      { path: 'second.md', before: null, after: 'New.', state: 'create' },
    ]), { code: 'EEXIST' });
    assert.equal(await readFile(collision, 'utf8'), 'Foreign staged content.');
    assert.equal(await readFile(join(root, 'first.md'), 'utf8'), 'Before.');
    await assert.rejects(readFile(join(root, 'second.md')), { code: 'ENOENT' });
  } finally {
    crypto.randomUUID = original;
    syncBuiltinESMExports();
  }
}));
