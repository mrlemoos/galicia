import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanSpecs, scanSummary } from '../src/check-specs.ts';

test('lifecycle flags retain evidence; old active specs ignored; no files mutated', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galicia-scan-'));
  try {
    const directory = join(root, 'domains/billing/docs/specs');
    await mkdir(directory, { recursive: true });
    const fixtures = {
      'old.md': 'Status: active\nCreated: 2001-01-01\n- [ ] Build it\n',
      'done.md': 'Status: complete\n- [ ] Assert exact symptom\n',
      'undecided.md': 'Status: complete\n## Unresolved decisions\n- Billing owner\n',
      'resolved.md': 'Status: complete\n## Unresolved decisions\nNone.\n',
      'replaced.md': 'Status: superseded\nSuperseded-by: old.md\n',
      'missing.md': 'Status: superseded\nSuperseded-by: missing-target.md\n',
      'abandoned.md': 'Status: abandoned\n',
      'escape.md': 'Status: superseded\nSuperseded-by: ../../../../../../etc/hosts\n',
    };
    for (const [name, text] of Object.entries(fixtures)) await writeFile(join(directory, name), text);
    await symlink('/etc/hosts', join(directory, 'external.md'));
    const result = await scanSpecs(root);
    assert.equal(result.inspected, 8);
    assert.equal(result.findings.length, 6);
    assert.match(result.findings.find(f => f.path.endsWith('undecided.md'))!.reason, /unresolved decisions/);
    assert.ok(!result.findings.some(f => f.path.endsWith('/old.md')));
    assert.match(result.findings.find(f => f.path.endsWith('missing.md'))!.reason, /missing/);
    assert.match(result.findings.find(f => f.path.endsWith('escape.md'))!.reason, /leaves repository/);
    assert.match(scanSummary(result), /No deletion/);
    for (const [name, text] of Object.entries(fixtures)) assert.equal(await readFile(join(directory, name), 'utf8'), text);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('scan bounds large files, excludes generated trees, caps startup output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galicia-bounds-'));
  try {
    await mkdir(join(root, 'docs/specs'), { recursive: true });
    await mkdir(join(root, 'node_modules/dependency/specs'), { recursive: true });
    await writeFile(join(root, 'node_modules/dependency/specs/old.md'), 'Status: abandoned');
    await writeFile(join(root, 'docs/specs/huge.md'), 'x'.repeat(65_537));
    for (let i = 0; i < 12; i++) await writeFile(join(root, `docs/specs/${i}.md`), 'Status: abandoned');
    const result = await scanSpecs(root);
    assert.equal(result.inspected, 12);
    assert.equal(result.findings.length, 12);
    assert.match(result.warnings[0]!, /64 KiB/);
    assert.match(scanSummary(result), /4 more/);
    assert.ok(scanSummary(result).length <= 2200);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('missing repository reports failure rather than a clean scan', async () => {
  await assert.rejects(scanSpecs('/nonexistent-galicia-project'), { code: 'ENOENT' });
});
