import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terse skill binds chat output, not just tone', async () => {
  const text = await readFile(new URL('../terse/SKILL.md', import.meta.url), 'utf8');
  assert.match(text, /Answer first/);
  assert.match(text, /No text between routine tool calls/);
  assert.match(text, /20 words/);
  assert.match(text, /longer than the code/);
  assert.match(text, /complete sentences/);
  assert.match(text, /changed lines/);
  assert.match(text, /not\/never\/no\/only/);
  assert.match(text, /Production unverified/);
  assert.match(text, /Default ultra/);
  assert.match(text, /hidden reasoning/i);
  assert.doesNotMatch(text, /Expand when ambiguity risks error/);
  assert.doesNotMatch(text, /\d+%/);
});
