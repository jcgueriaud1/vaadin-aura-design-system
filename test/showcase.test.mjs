#!/usr/bin/env node
/**
 * check-showcase is the only thing standing between "every component is in the
 * design system project" and a claim nobody re-checks. A coverage check that
 * passes vacuously looks exactly like one that works, so each rule is proved to
 * still fail — including the two failures that look like success: a config with
 * no cards, and an omission whose "reason" says nothing.
 *
 * Fixtures are built from the real kit and then broken one rule at a time, so a
 * Vaadin bump changes the fixtures with the shipped config rather than leaving
 * them describing an older package.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const real = JSON.parse(readFileSync('.design-sync/config.json', 'utf8'));

const check = (config) =>
  spawnSync(process.execPath, ['scripts/check-showcase.mjs', ...(config ? [config] : [])], {
    encoding: 'utf8',
  });

const STORY = [
  "import { Button } from '@vaadin/react-components/Button.js';",
  '',
  'export const Only = () => <Button>Only</Button>;',
  '',
  "export const __order = ['Only'];",
  '',
].join('\n');

/**
 * A config that passes, then broken by the caller. Everything not carded is
 * omitted with a reason, so a fixture exercises exactly the rule it is named for.
 */
function scaffold({ components, omitted = {}, kit = real.kit, story = STORY, writeStory = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'showcase-'));
  mkdirSync(join(dir, 'showcase'));
  const cards = components ?? [{ name: 'Button', group: 'Actions' }];
  if (writeStory) {
    for (const card of cards) writeFileSync(join(dir, 'showcase', `${card.name}.tsx`), story);
  }

  const claimed = new Set(cards.flatMap((card) => [card.name, ...(card.covers ?? [])]));
  const reasons = Object.fromEntries(
    kit
      .filter((name) => !claimed.has(name) && !(name in omitted))
      .map((name) => [name, 'Not part of this fixture, which exists to exercise one rule only.']),
  );

  const config = join(dir, 'config.json');
  writeFileSync(
    config,
    JSON.stringify({ namespace: 'Fixture', kit, omitted: { ...reasons, ...omitted }, components: cards, guidelines: [] }),
  );
  return config;
}

test('the shipped config passes', () => {
  const { status, stdout } = check();
  assert.equal(status, 0, `expected .design-sync/config.json to pass, got:\n${stdout}`);
  assert.match(stdout, /cover all \d+ components of @vaadin\/react-components/);
});

test('a scaffolded fixture passes, so the failures below mean something', () => {
  const { status, stdout } = check(scaffold());
  assert.equal(status, 0, `expected the baseline fixture to pass, got:\n${stdout}`);
});

test('detects a component with no card, no covers and no omission', () => {
  const config = scaffold();
  const parsed = JSON.parse(readFileSync(config, 'utf8'));
  delete parsed.omitted.Grid;
  writeFileSync(config, JSON.stringify(parsed));

  const { status, stderr } = check(config);
  assert.equal(status, 1);
  assert.match(stderr, /UNCOVERED\s+Grid/);
});

test('detects a component the package exports and the kit does not list', () => {
  const { status, stderr } = check(scaffold({ kit: real.kit.filter((name) => name !== 'Grid') }));
  assert.equal(status, 1);
  assert.match(stderr, /UNTRANSCRIBED\s+Grid/);
});

test('detects a kit entry the package no longer exports', () => {
  const { status, stderr } = check(scaffold({ kit: [...real.kit, 'RichTextEditor'] }));
  assert.equal(status, 1);
  assert.match(stderr, /VANISHED\s+RichTextEditor/);
});

test('rejects an omission without a real reason', () => {
  const { status, stderr } = check(scaffold({ omitted: { Grid: 'later' } }));
  assert.equal(status, 1);
  assert.match(stderr, /omitted\.Grid needs a reason/);
});

test('rejects a component that is both carded and omitted', () => {
  const { status, stderr } = check(scaffold({ omitted: { Button: 'Carded as well, which is the contradiction.' } }));
  assert.equal(status, 1);
  assert.match(stderr, /Button is claimed twice over/);
});

test('detects a covers entry claimed by two cards', () => {
  const { status, stderr } = check(
    scaffold({
      components: [
        { name: 'Button', group: 'Actions', covers: ['Icon'] },
        { name: 'Badge', group: 'Content', covers: ['Icon'] },
      ],
    }),
  );
  assert.equal(status, 1);
  assert.match(stderr, /Icon is covered twice/);
});

test('detects a card with no stories file', () => {
  const { status, stderr } = check(scaffold({ writeStory: false }));
  assert.equal(status, 1);
  assert.match(stderr, /Button has no stories at/);
});

test('detects a stories file that exports no stories', () => {
  const { status, stderr } = check(scaffold({ story: 'export const notAStory = 1;\n' }));
  assert.equal(status, 1);
  assert.match(stderr, /exports no stories/);
});

test('detects a missing __order, and one that disagrees with the exports', () => {
  const noOrder = check(scaffold({ story: "export const Only = () => null;\n" }));
  assert.equal(noOrder.status, 1);
  assert.match(noOrder.stderr, /has no __order/);

  const stale = check(
    scaffold({ story: "export const Only = () => null;\nexport const Second = () => null;\nexport const __order = ['Only', 'Gone'];\n" }),
  );
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Second is missing from __order/);
  assert.match(stale.stderr, /__order names Gone, which is not exported/);
});

test('applies the DESIGN.md rules to stories: no Lumo, no hardcoded colour', () => {
  const { status, stderr } = check(
    scaffold({
      story: [
        "import './css/lumo/Utility.module.css';",
        "export const Only = () => <div style={{ color: '#4a90d9', border: 'var(--lumo-border)' }} />;",
        "export const __order = ['Only'];",
        '',
      ].join('\n'),
    }),
  );
  assert.equal(status, 1);
  assert.match(stderr, /hardcoded colour: #4a90d9/);
  assert.match(stderr, /--lumo-border/);
});

test('a card without a group is rejected', () => {
  const { status, stderr } = check(scaffold({ components: [{ name: 'Button' }] }));
  assert.equal(status, 1);
  assert.match(stderr, /Button has no group/);
});

test('a source that does not exist is rejected', () => {
  const { status, stderr } = check(
    scaffold({ components: [{ name: 'Button', group: 'Actions', source: 'components/Gone.tsx' }] }),
  );
  assert.equal(status, 1);
  assert.match(stderr, /points at components\/Gone\.tsx, which does not exist/);
});

test('a config with no cards fails rather than passing vacuously', () => {
  const config = scaffold();
  const parsed = JSON.parse(readFileSync(config, 'utf8'));
  parsed.components = [];
  parsed.omitted.Button = 'Emptied out to prove an empty config is not a pass.';
  writeFileSync(config, JSON.stringify(parsed));

  const { status, stderr } = check(config);
  assert.equal(status, 1);
  assert.match(stderr, /declares no cards/);
});
