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

// --- Layering contract ---------------------------------------------------

test('accepts the base tokens as fully classified', () => {
  const { stdout } = validate('tokens/tokens.json');
  assert.match(stdout, /layering contract holds/);
  assert.match(stdout, /semantic/);
});

test('rejects a token with no layer marker', () => {
  const { status, stderr } = validate('test/fixtures/missing-layer.json');
  assert.equal(status, 1, 'an unclassifiable token must fail');
  assert.match(stderr, /color\.blue\.600: no \$extensions/);
});

test('rejects a layer outside primitive|semantic', () => {
  const { status, stderr } = validate('test/fixtures/unknown-layer.json');
  assert.equal(status, 1);
  assert.match(stderr, /layer "brand" is not one of/);
});

test('rejects a primitive that references a semantic token', () => {
  const { status, stderr } = validate('test/fixtures/inverted-layer.json');
  assert.equal(status, 1, 'inverted layering must fail');
  assert.match(stderr, /layering inverted/);
});

// Pins the finding that drove the authoring rule: Style Dictionary inherits
// $type down a group but not $extensions, so a group-level marker leaves its
// children unclassified. If SD ever changes this, this test fails loudly and
// the per-token requirement can be revisited.
test('group-level $extensions does not classify children', () => {
  const { status, stderr } = validate('test/fixtures/group-level-layer.json');
  assert.equal(status, 1, 'group-level markers are not inherited — mark every token');
  assert.match(stderr, /color\.gray\.50: no \$extensions/);
});
