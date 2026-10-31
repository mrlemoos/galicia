import test from 'node:test';
import assert from 'node:assert/strict';
import { planRelease } from '../scripts/release-plan.ts';

const release = (tag_name: string, draft = false, prerelease = false) => ({ tag_name, draft, prerelease });

test('release plan publishes new stable versions and skips published versions', () => {
  assert.deepEqual(planRelease('0.1.0', []), { tag: 'v0.1.0', publish: true });
  assert.equal(planRelease('0.1.0', [release('v0.1.0')]).publish, false);
  assert.equal(planRelease('0.10.0', [release('v0.9.9')]).publish, true);
  assert.equal(planRelease('1.0.0', [release('v0.99.99')]).publish, true);
  assert.equal(planRelease('0.2.0', [release('v9.0.0-beta', false, true)]).publish, true);
});

test('release plan rejects invalid versions, downgrades and unfinished drafts', () => {
  for (const version of ['01.0.0', 'v1.0.0', '1.0.0-beta', '1.0', '']) {
    assert.throws(() => planRelease(version, []), /stable/);
  }
  assert.throws(() => planRelease('0.2.0', [release('v0.10.0')]), /must exceed/);
  assert.throws(() => planRelease('0.2.0', [release('v0.2.0', true)]), /Recover existing draft/);
});
