#!/usr/bin/env node
/**
 * Checks tokens/tokens.json against the @vaadin/aura source it was transcribed
 * from, so an Aura upgrade reports exactly what moved instead of leaving the
 * base quietly describing a theme that no longer exists.
 *
 * Three failure modes:
 *   VANISHED     a token maps to a custom property Aura no longer defines
 *   DRIFTED      Aura changed the value behind a token
 *   UNTRANSCRIBED  Aura gained an authorable input with no token
 *
 * Only Aura's *inputs* are in scope. Properties computed at runtime with
 * light-dark(), oklch(from ...), color-mix(), round() or calc() cannot be
 * expressed as a static DTCG $value and belong to the computed snapshot.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const NS = 'com.vaadin.aura';

// Aura inputs we deliberately do not model, and why. An entry here is a design
// decision on record; anything else new in Aura fails the check.
const OMITTED = {
  '--aura-content-color-scheme': 'CSS-wide keyword (`inherit`) with no DTCG type',
  '--aura-notification-color-scheme': 'CSS-wide keyword (`inherit`) with no DTCG type',
  '--aura-font-family-system': 'raw stack, modelled as the primitive aura.stack.system',
  '--aura-font-family-instrument-sans':
    'raw stack, modelled as the primitive aura.stack.instrument-sans; the supported override point is aura.font.family',
  '--aura-accent-color-light-initial': 'internal bookkeeping so .aura-accent-color can restore the default',
  '--aura-accent-color-dark-initial': 'internal bookkeeping so .aura-accent-color can restore the default',
  '--aura-app-background': 'derived wiring, not an input',
  '--vaadin-background-color': 'derived wiring, not an input',
  '--vaadin-icon-baseline-font-family': 'derived wiring, not an input',
  '--vaadin-user-color': 'derived wiring, not an input',
  '--vaadin-padding-inline-container': 'derived wiring, not an input',
};

const COMPUTED = /\b(calc|light-dark|color-mix|round|clamp)\s*\(|oklch\(\s*from/;

// --- read Aura -----------------------------------------------------------
const require = createRequire(import.meta.url);
const auraSrc = join(dirname(require.resolve('@vaadin/aura/package.json')), 'src');
const auraVersion = require('@vaadin/aura/package.json').version;

const css = readdirSync(auraSrc)
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(join(auraSrc, f), 'utf8'))
  .join('\n');

const declared = new Map();
for (const [, name, value] of css.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)) {
  if (!declared.has(name)) declared.set(name, value.replace(/\s+/g, ' ').trim());
}

// Expand var() references, including nested ones: Aura composes its font stack
// as `'Instrument Sans', var(--aura-font-family-system)`, which is the same
// stack we write out in full as a DTCG array.
const deref = (value, depth = 0) => {
  if (depth > 10) return value;
  const expanded = value.replace(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g, (whole, name) =>
    declared.has(name) ? declared.get(name) : whole,
  );
  return expanded === value ? value : deref(expanded, depth + 1);
};

// --- read our tokens -----------------------------------------------------
const tokensPath = process.argv[2] ?? 'tokens/tokens.json';
const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

function* walk(node, path = []) {
  if (node === null || typeof node !== 'object') return;
  if ('$value' in node) yield [path.join('.'), node];
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith('$')) yield* walk(child, [...path, key]);
  }
}
const byPath = new Map(walk(tokens));

const resolve = (value) => {
  let v = value;
  while (typeof v === 'string' && v.startsWith('{') && v.endsWith('}')) {
    v = byPath.get(v.slice(1, -1))?.$value;
  }
  return v;
};

// A font stack is the same stack whether Aura writes it with quotes and a
// nested var() or we write it as a DTCG array.
const normalise = (value) =>
  String(Array.isArray(value) ? value.join(', ') : value)
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .join(', ');

// --- compare -------------------------------------------------------------
const problems = { VANISHED: [], DRIFTED: [], UNTRANSCRIBED: [] };
const claimed = new Set();

for (const [path, token] of byPath) {
  const cssVar = token.$extensions?.[NS]?.cssVar;
  if (!cssVar) continue;
  claimed.add(cssVar);

  if (!declared.has(cssVar)) {
    problems.VANISHED.push(`${path} → ${cssVar} is no longer defined by Aura`);
    continue;
  }
  const theirs = normalise(deref(declared.get(cssVar)));
  const ours = normalise(resolve(token.$value));
  if (ours !== theirs) {
    problems.DRIFTED.push(`${path} (${cssVar})\n      ours:  ${ours}\n      aura:  ${theirs}`);
  }
}

for (const [name, value] of declared) {
  if (name.startsWith('--_') || claimed.has(name) || name in OMITTED) continue;
  if (COMPUTED.test(value) || /var\(/.test(value)) continue; // derived, not an input
  problems.UNTRANSCRIBED.push(`${name}: ${value}`);
}

// --- report --------------------------------------------------------------
const total = Object.values(problems).flat().length;
if (total === 0) {
  console.log(
    `✓ ${tokensPath} matches @vaadin/aura@${auraVersion} ` +
      `(${claimed.size} inputs transcribed, ${Object.keys(OMITTED).length} omitted by decision)`,
  );
  process.exit(0);
}

console.error(`\n✗ ${tokensPath} has drifted from @vaadin/aura@${auraVersion}\n`);
for (const [kind, list] of Object.entries(problems)) {
  if (list.length === 0) continue;
  console.error(`  ${kind} (${list.length}):`);
  for (const item of list) console.error(`    - ${item}`);
  console.error('');
}
console.error('Update the tokens, or record a deliberate omission in OMITTED with a reason.\n');
process.exit(1);
