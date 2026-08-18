#!/usr/bin/env node
/**
 * The computed snapshot's whole claim is that it is generated, current, and
 * untouched. Nothing about a JSON file makes that self-evident, so the claim is
 * carried by hashes in its header and enforced by check-computed-snapshot.mjs —
 * which means that check needs the same treatment as the other guards: proof
 * that it still fails on a snapshot it is supposed to reject.
 *
 * Fixtures are built here from the committed snapshot rather than checked in:
 * the file is generated, and a hand-written copy of a generated artifact would
 * be exactly the thing this test exists to catch.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NS, hash, partition, readInputs } from '../scripts/lib/aura-surface.mjs';

const SNAPSHOTS = 'tokens/computed';
const LIGHT = 'aura-light.computed.json';

const check = (args = []) =>
  spawnSync(process.execPath, ['scripts/check-computed-snapshot.mjs', ...args], { encoding: 'utf8' });

/** A copy of the committed snapshots with `mutate` applied to the light one. */
const withSnapshot = (mutate) => {
  const dir = mkdtempSync(join(tmpdir(), 'aura-snapshot-'));
  cpSync(SNAPSHOTS, dir, { recursive: true });
  const path = join(dir, LIGHT);
  const snapshot = JSON.parse(readFileSync(path, 'utf8'));
  mutate(snapshot);
  writeFileSync(path, JSON.stringify(snapshot, null, 2));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
};

/** Re-seal a mutated snapshot so its body hash agrees with its contents again.
 *  Used to prove the staleness checks stand on their own rather than only
 *  working because a hand edit happens to break the hash. */
const reseal = (snapshot) => {
  const { bodyHash, ...header } = snapshot.$extensions[NS].generated;
  snapshot.$extensions[NS].generated = { ...header, bodyHash: hash({ ...snapshot, $extensions: { ...snapshot.$extensions, [NS]: { generated: header } } }) };
};

const expectFail = (kind, mutate) => {
  const { dir, cleanup } = withSnapshot(mutate);
  try {
    const { status, stderr } = check(['--dir', dir]);
    assert.equal(status, 1, `expected a failure, got exit ${status}`);
    assert.match(stderr, new RegExp(kind));
    return stderr;
  } finally {
    cleanup();
  }
};

test('accepts the committed snapshots', () => {
  const { status, stdout } = check();
  assert.equal(status, 0, `expected exit 0, got:\n${stdout}`);
  assert.match(stdout, /covering all \d+ derived properties/);
});

// The hash covers meaning, not formatting: re-indenting the file is harmless,
// so a diff-noise reformat must not read as tampering.
test('accepts a reformatted snapshot', () => {
  const { dir, cleanup } = withSnapshot(() => {});
  try {
    const path = join(dir, LIGHT);
    writeFileSync(path, JSON.stringify(JSON.parse(readFileSync(path, 'utf8')), null, 8));
    assert.equal(check(['--dir', dir]).status, 0);
  } finally {
    cleanup();
  }
});

test('rejects a hand-edited value', () => {
  expectFail('EDITED', (s) => {
    s.computed['--vaadin-text-color'].$value = 'oklch(0.5 0 0)';
  });
});

test('rejects a hand-edited sRGB form', () => {
  expectFail('EDITED', (s) => {
    s.computed['--vaadin-border-color'].$extensions[NS].srgb = '#123456';
  });
});

test('rejects a snapshot with no generated header', () => {
  expectFail('MALFORMED', (s) => {
    delete s.$extensions;
  });
});

test('rejects a missing snapshot', () => {
  const { dir, cleanup } = withSnapshot(() => {});
  try {
    rmSync(join(dir, LIGHT));
    const { status, stderr } = check(['--dir', dir]);
    assert.equal(status, 1);
    assert.match(stderr, /MISSING/);
  } finally {
    cleanup();
  }
});

// A snapshot generated against a different Aura describes a theme that no
// longer exists — the same failure mode check:aura exists to prevent for the
// inputs. Re-sealed, so this is the version check firing and not the body hash.
test('rejects a snapshot generated from another Aura release', () => {
  const stderr = expectFail('STALE', (s) => {
    s.$extensions[NS].generated.auraVersion = '25.0.0';
    reseal(s);
  });
  assert.doesNotMatch(stderr, /EDITED/);
});

// A different Chromium can resolve or serialise a computed colour differently,
// so the renderer is part of the snapshot's provenance too.
test('rejects a snapshot read by another browser build', () => {
  expectFail('STALE', (s) => {
    s.$extensions[NS].generated.engine = 'Chromium 100.0.0.0';
    reseal(s);
  });
});

test('rejects a snapshot generated from different inputs', () => {
  // The drift fixture moves aura.background.light, which re-derives every text,
  // border and surface colour: the committed snapshot cannot describe it.
  const { status, stderr } = check(['--tokens', 'test/fixtures/drift-value.json']);
  assert.equal(status, 1);
  assert.match(stderr, /STALE/);
  assert.match(stderr, /different inputs/);
});

test('rejects a derived property the snapshot does not account for', () => {
  const stderr = expectFail('COVERAGE', (s) => {
    delete s.computed['--vaadin-text-color'];
    reseal(s);
  });
  assert.match(stderr, /--vaadin-text-color/);
});

test('rejects an entry that restates an input', () => {
  const stderr = expectFail('COVERAGE', (s) => {
    s.computed['--aura-base-size'] = { $type: 'dimension', $value: '16px', $extensions: { [NS]: { derived: true, from: [] } } };
    reseal(s);
  });
  assert.match(stderr, /is an input/);
});

test('rejects an entry that is not marked derived', () => {
  expectFail('MALFORMED', (s) => {
    delete s.computed['--vaadin-text-color'].$extensions[NS].derived;
    reseal(s);
  });
});

test('rejects a colour with no sRGB form to compare a pixel against', () => {
  expectFail('MALFORMED', (s) => {
    delete s.computed['--vaadin-text-color'].$extensions[NS].srgb;
    reseal(s);
  });
});

// The snapshot and tokens/tokens.json are meant to partition Aura's public root
// surface between them; a property that fell into neither would be invisible to
// both checks.
test('inputs and derived properties partition Aura root surface', () => {
  const inputs = readInputs('tokens/tokens.json');
  const { declared, internal, inputs: inputProps, derived, authored } = partition(inputs);
  assert.equal(internal.length + inputProps.length + derived.length + authored.length, declared.size);
  assert.equal(
    derived.filter((name) => inputs.has(name)).length,
    0,
    'a derived property must not also be an authored input',
  );
  // Everything left over is a static public value with no token — that is
  // check-aura-drift's UNTRANSCRIBED, and it keeps its own OMITTED list.
  assert.ok(authored.length < inputProps.length, 'more untranscribed inputs than transcribed ones');
});

test('the snapshot records which inputs each value came from', () => {
  const light = JSON.parse(readFileSync(join(SNAPSHOTS, LIGHT), 'utf8'));
  const text = light.computed['--vaadin-text-color'].$extensions[NS];
  assert.deepEqual(text.from, ['aura.background.dark', 'aura.background.light', 'aura.contrast-level']);
  assert.equal(light.computed['--vaadin-radius-m'].$extensions[NS].from[0], 'aura.base.radius');
});
