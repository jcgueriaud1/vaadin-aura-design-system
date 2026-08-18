#!/usr/bin/env node
/**
 * The examples are few-shot prompts, so a rule broken in one of them teaches
 * the break. Same treatment as the other checks: prove the check still fails
 * when it should, including on the failure that looks most like success — an
 * empty directory.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const check = (dir) =>
  spawnSync(process.execPath, ['scripts/check-examples.mjs', ...(dir ? [dir] : [])], {
    encoding: 'utf8',
  });

const BAD = 'test/fixtures/bad-examples';

test('the shipped examples pass', () => {
  const { status, stdout } = check();
  assert.equal(status, 0, `expected components/ to pass, got:\n${stdout}`);
  assert.match(stdout, /verified against @vaadin\/react-components@/);
});

test('detects a Lumo stylesheet import and a --lumo-* property', () => {
  const { status, stderr } = check(BAD);
  assert.equal(status, 1);
  assert.match(stderr, /css\/lumo\/Utility\.module\.css/);
  assert.match(stderr, /--lumo-font-size-m/);
});

test('detects a hardcoded colour and a hardcoded length in a style object', () => {
  const { stderr } = check(BAD);
  assert.match(stderr, /hardcoded colour: #4a90d9/);
  assert.match(stderr, /hardcoded length: 8px/);
});

// The whole point of the version line is that it stops being true on its own.
test('detects a "verified against" claim that no longer matches the pinned version', () => {
  const { stderr } = check(BAD);
  assert.match(stderr, /claims 24\.9\.17, repo pins/);
});

test('detects an example with no version claim at all', () => {
  const { stderr } = check(BAD);
  assert.match(stderr, /NoClaim\.tsx.*no "Verified against/s);
});

test('detects an example the render harness never mounts', () => {
  const { stderr } = check(BAD);
  assert.match(stderr, /Bad is never mounted in sandbox\/main\.tsx/);
});

test('does not flag a 1px hairline or a token reference', () => {
  const { stderr } = check(BAD);
  assert.doesNotMatch(stderr, /1px/);
  assert.doesNotMatch(stderr, /--vaadin-padding-m|--vaadin-border-color|--vaadin-text-color/);
});

// An empty directory passing every rule is indistinguishable from a working
// check, which is exactly how the original token validation went unnoticed.
test('refuses to pass vacuously on a directory with no examples', () => {
  const empty = mkdtempSync(join(tmpdir(), 'aura-examples-'));
  const { status, stderr } = check(empty);
  assert.equal(status, 1);
  assert.match(stderr, /no examples/);
});

test('refuses to run when @vaadin/react-components is not pinned exactly', () => {
  // A range pin makes every "verified against" claim unfalsifiable: the version
  // an example names would be one of many the repo accepts.
  const dir = mkdtempSync(join(tmpdir(), 'aura-examples-'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ devDependencies: { '@vaadin/react-components': '^25.2.8' } }),
  );
  mkdirSync(join(dir, 'components'));
  const { status, stderr } = spawnSync(
    process.execPath,
    [join(process.cwd(), 'scripts/check-examples.mjs')],
    { encoding: 'utf8', cwd: dir },
  );
  assert.equal(status, 1);
  assert.match(stderr, /pinned exactly/);
});
