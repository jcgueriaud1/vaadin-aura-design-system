#!/usr/bin/env node
/**
 * Guards the guard.
 *
 * The layering contract is only as good as the validator: the previous version
 * of this check used `platforms: {}`, which initialises cleanly no matter how
 * many references dangle, so it passed everything. This asserts the validator
 * still fails on a token file it is supposed to reject.
 */
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const validate = (file) =>
  spawnSync(process.execPath, ['scripts/validate-tokens.mjs', file], { encoding: 'utf8' });

test('accepts the base tokens', () => {
  const { status, stdout } = validate('tokens/tokens.json');
  assert.equal(status, 0, `expected exit 0, got ${status}`);
  assert.match(stdout, /all references resolve/);
});

test('rejects a dangling reference', () => {
  const { status, stderr } = validate('test/fixtures/broken-reference.json');
  assert.equal(status, 1, 'a dangling reference must fail the build');
  assert.match(stderr, /could not be found/);
});

test('rejects a file that does not exist', () => {
  assert.equal(validate('tokens/nope.json').status, 1);
});

test('rejects a token file with no tokens', () => {
  const { status, stderr } = validate('test/fixtures/empty.json');
  assert.equal(status, 1, 'an empty token set must not pass as valid');
  assert.match(stderr, /no tokens/);
});
