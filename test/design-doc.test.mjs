#!/usr/bin/env node
/**
 * DESIGN.md is agent policy, so a stale property name in it propagates into
 * generated code and resolves to nothing at runtime. Same treatment as the
 * other checks: prove it still fails when it should.
 */
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const check = (file) =>
  spawnSync(process.execPath, ['scripts/check-design-doc.mjs', ...(file ? [file] : [])], {
    encoding: 'utf8',
  });

test('every name DESIGN.md recommends exists in Aura', () => {
  const { status, stdout } = check();
  assert.equal(status, 0, `expected all names to resolve, got:\n${stdout}`);
  assert.match(stdout, /all exist in @vaadin\/aura@/);
});

test('detects a property Aura does not define', () => {
  const { status, stderr } = check('test/fixtures/bad-design-doc.md');
  assert.equal(status, 1);
  assert.match(stderr, /--aura-primary-color/);
});

test('detects a helper class Aura does not define', () => {
  const { stderr } = check('test/fixtures/bad-design-doc.md');
  assert.match(stderr, /\.aura-accent-teal/);
});

// The document has to be able to name Lumo in order to forbid it.
test('does not flag --lumo-*, which the document names to forbid', () => {
  const { stderr } = check('test/fixtures/bad-design-doc.md');
  assert.doesNotMatch(stderr, /--lumo-/);
});
