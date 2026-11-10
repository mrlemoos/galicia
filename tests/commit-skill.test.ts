import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('commit skill binds tested slices, not a single dump', async () => {
  const text = await readFile(new URL('../commit/SKILL.md', import.meta.url), 'utf8');
  assert.match(text, /unit-test/);
  assert.match(text, /behavioural-test/);
  assert.match(text, /e2e-test/);
  assert.match(text, /same commit/);
  assert.match(text, /Do not stage or commit before approval/);
  assert.match(text, /Do not restate its rules/);
  assert.match(text, /Never claim green or committed without command output/);
  assert.match(text, /Two behaviours means two commits/);
});
