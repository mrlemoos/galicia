import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, mkdir, symlink, cp } from 'node:fs/promises';
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
const options = (project: string): Options => ({ project, agents: ['codex', 'claude', 'cursor', 'grok'], skills: ['terse', 'rubberduck', 'spec', 'breakdown', 'find-rc', 'unit-test', 'behavioural-test', 'e2e-test'], cadence: 'batch', hooks: true });

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

test('setup installs unambiguous spec, ADR and ticket templates', async () => fixture(async root => {
  const plan = await planInstall(options(root));
  await applyPlan(plan.root, plan.changes);
  const expected = {
    'spec.md': ['Status: draft', 'Domain:', '## Intended behaviour', '## Acceptance checks', '## Unresolved decisions'],
    'adr.md': ['Status: proposed', '## Context', '## Decision', '## Alternatives', '## Consequences', '## Linked specs'],
    'ticket.md': ['Status: ready', 'Parent:', 'Blocked by:', '## What to build', '## Acceptance checks', '## Validation'],
  };
  for (const [name, required] of Object.entries(expected)) {
    const body = await readFile(join(root, '.galicia/templates', name), 'utf8');
    for (const text of required) assert.match(body, new RegExp(text));
  }
  assert.match(await readFile(join(root, 'AGENTS.md'), 'utf8'), /\.galicia\/templates\/adr\.md, spec\.md, or ticket\.md/);
  assert.match(await readFile(join(root, 'docs/specs/README.md'), 'utf8'), /\.galicia\/templates\/spec\.md/);
  assert.match(await readFile(join(root, 'docs/adr/README.md'), 'utf8'), /\.galicia\/templates\/adr\.md/);
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

test('kept edits persist across quiet runs, other changes, and new Galicia copies', async () => fixture(async root => {
  const { sealPlan } = await import('../src/install.ts');
  const path = '.agents/skills/terse/SKILL.md';
  const initial = await planInstall(options(root));
  await applyPlan(root, initial.changes);
  await writeFile(join(root, path), 'Custom skill.');
  const changed = await planInstall({ ...options(root), cadence: 'one' });
  const sealed = sealPlan(changed.changes, { [path]: 'keep' });
  await applyPlan(root, sealed);
  assert.equal(await readFile(join(root, path), 'utf8'), 'Custom skill.');
  const receipt = JSON.parse(await readFile(join(root, '.galicia/manifest.json'), 'utf8'));
  assert.match(receipt.declined[path], /^[a-f0-9]{64}$/);
  assert.equal(JSON.parse(await readFile(join(root, '.galicia/config.json'), 'utf8')).cadence, 'one');
  const again = await planInstall({ ...options(root), cadence: 'one' });
  assert.equal(again.changes.find(c => c.path === '.galicia/manifest.json')!.state, 'same');
  const differentCadence = await planInstall(options(root));
  await applyPlan(root, differentCadence.changes);
  assert.deepEqual(JSON.parse(await readFile(join(root, '.galicia/manifest.json'), 'utf8')).declined, receipt.declined);
  await fixture(async source => {
    for (const name of ['terse', 'rubberduck', 'spec', 'breakdown', 'find-rc', 'unit-test', 'behavioural-test', 'e2e-test', 'templates', 'src', 'NOTICE.md', 'LICENSE']) {
      await cp(join(sourceRoot, name), join(source, name), { recursive: true });
    }
    await writeFile(join(source, 'terse/SKILL.md'), 'New Galicia copy.');
    const newer = await planInstall(options(root), source);
    assert.equal(newer.changes.find(c => c.path === path)!.state, 'conflict');
    await assert.rejects(applyPlan(root, newer.changes), /Conflicts/);
    assert.equal(await readFile(join(root, path), 'utf8'), 'Custom skill.');
  });
  await writeFile(join(root, path), 'Further edit.');
  const edited = await planInstall(options(root));
  assert.equal(edited.changes.find(c => c.path === path)!.state, 'conflict');
  const take = sealPlan(edited.changes, { [path]: 'take' });
  await applyPlan(root, take);
  assert.equal(JSON.parse(await readFile(join(root, '.galicia/manifest.json'), 'utf8')).declined, undefined);
}));

test('unowned files update, context stays, incomplete guidance aborts', async () => fixture(async root => {
  await mkdir(join(root, '.agents/skills/terse'), { recursive: true });
  await writeFile(join(root, '.agents/skills/terse/SKILL.md'), 'Unowned.');
  await writeFile(join(root, 'AGENTS.md'), 'My rules.\n<!-- galicia:start -->\nOld block.\n<!-- galicia:end -->\n');
  const plan = await planInstall(options(root));
  assert.equal(plan.changes.find(c => c.path === '.agents/skills/terse/SKILL.md')!.state, 'update');
  assert.equal(plan.changes.find(c => c.path === 'AGENTS.md')!.state, 'update');
  await applyPlan(root, plan.changes);
  assert.match(await readFile(join(root, 'AGENTS.md'), 'utf8'), /^My rules/);
  await rm(join(root, '.galicia/manifest.json'));
  await writeFile(join(root, '.galicia/config.json'), 'Unowned config.');
  assert.equal((await planInstall(options(root))).changes.find(c => c.path === '.galicia/config.json')!.state, 'update');
  await writeFile(join(root, 'AGENTS.md'), '<!-- galicia:start -->');
  await assert.rejects(planInstall(options(root)), /Incomplete/);
}));

test('CLI conflict recovery and dry-run have actionable output without unintended writes', async () => fixture(async root => {
  const cli = join(sourceRoot, 'src/cli.ts');
  const run = (...args: string[]) => spawnSync(process.execPath, [cli, 'init', '--project', root, '--agents', 'codex', ...args], { encoding: 'utf8' });
  assert.equal(run('--yes').status, 0);
  const path = join(root, '.agents/skills/terse/SKILL.md');
  await writeFile(path, 'Mine.');
  const before = await readFile(join(root, '.galicia/manifest.json'), 'utf8');
  const blocked = run('--yes');
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /Conflicting files.*terse\/SKILL.md.*--on-conflict/);
  const preview = run('--dry-run');
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /before ---\nMine\./);
  assert.match(preview.stdout, /--- after ---/);
  assert.equal(await readFile(join(root, '.galicia/manifest.json'), 'utf8'), before);
  assert.equal(run('--on-conflict=invalid', '--yes').status, 1);
  assert.equal(run('--on-conflict=keep', '--yes').status, 0);
  assert.equal(await readFile(path, 'utf8'), 'Mine.');
  assert.match(run('--yes').stdout, /Already initialised/);
  await writeFile(path, 'Another edit.');
  assert.equal(run('--on-conflict=take', '--yes').status, 0);
  assert.notEqual(await readFile(path, 'utf8'), 'Another edit.');
}));

test('invalid declined manifest hashes abort planning', async () => fixture(async root => {
  const plan = await planInstall(options(root));
  await applyPlan(root, plan.changes);
  for (const declined of [null, [], { path: 4 }, { path: 'invalid' }]) {
    await writeFile(join(root, '.galicia/manifest.json'), JSON.stringify({ version: 1, files: {}, declined }));
    await assert.rejects(planInstall(options(root)));
  }
}));

test('conflicts resolve independently and cancelling sealing leaves disk untouched', async () => fixture(async root => {
  const { sealPlan } = await import('../src/install.ts');
  const initial = await planInstall(options(root));
  await applyPlan(root, initial.changes);
  const kept = '.agents/skills/terse/SKILL.md';
  const taken = '.claude/skills/terse/SKILL.md';
  for (const path of [kept, taken]) await writeFile(join(root, path), 'My edit.');
  const plan = await planInstall(options(root));
  assert.throws(() => sealPlan(plan.changes, { [kept]: 'keep' }), /Unresolved conflict/);
  for (const path of [kept, taken]) assert.equal(await readFile(join(root, path), 'utf8'), 'My edit.');
  await applyPlan(root, sealPlan(plan.changes, { [kept]: 'keep', [taken]: 'take' }));
  assert.equal(await readFile(join(root, kept), 'utf8'), 'My edit.');
  assert.notEqual(await readFile(join(root, taken), 'utf8'), 'My edit.');
  const receipt = JSON.parse(await readFile(join(root, '.galicia/manifest.json'), 'utf8'));
  assert.deepEqual(Object.keys(receipt.declined), [kept]);
}));
