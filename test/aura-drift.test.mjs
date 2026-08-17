#!/usr/bin/env node
/**
 * The drift check is what keeps tokens/tokens.json honest about the Aura
 * release it was transcribed from, so it needs the same treatment as the
 * token validator: proof that it still fails when it should.
 */
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const check = (file) =>
  spawnSync(process.execPath, ['scripts/check-aura-drift.mjs', ...(file ? [file] : [])], {
    encoding: 'utf8',
  });

test('base tokens match the pinned Aura release', () => {
  const { status, stdout } = check();
  assert.equal(status, 0, `expected a match, got:\n${stdout}`);
  assert.match(stdout, /matches @vaadin\/aura@/);
});

test('detects a value that no longer matches Aura', () => {
  const { status, stderr } = check('test/fixtures/drift-value.json');
  assert.equal(status, 1);
  assert.match(stderr, /DRIFTED/);
  assert.match(stderr, /aura\.background\.light/);
});

test('detects a token mapped to a property Aura no longer defines', () => {
  const { status, stderr } = check('test/fixtures/drift-vanished.json');
  assert.equal(status, 1);
  assert.match(stderr, /VANISHED/);
});

// The same run should notice that the real property is now unclaimed — that is
// how a future Aura release adding a knob gets caught rather than ignored.
test('reports an Aura input with no token as untranscribed', () => {
  const { stderr } = check('test/fixtures/drift-vanished.json');
  assert.match(stderr, /UNTRANSCRIBED/);
  assert.match(stderr, /--aura-contrast-level/);
});
