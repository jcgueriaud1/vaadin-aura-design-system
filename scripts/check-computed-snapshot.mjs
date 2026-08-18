#!/usr/bin/env node
/**
 * Keeps the computed snapshot honest without needing a browser, so it can run
 * in the same 9-second validate as everything else.
 *
 * The snapshot is generated, never authored, and only useful if it still
 * describes the theme the inputs produce. Four ways that can stop being true:
 *
 *   MISSING   a snapshot for a colour scheme is not there at all
 *   STALE     it records a different @vaadin/aura release or different inputs
 *   EDITED    its body no longer hashes to what the generator recorded
 *   COVERAGE  Aura's derived surface has properties the snapshot does not
 *
 * Usage: node scripts/check-computed-snapshot.mjs [--dir <dir>] [--tokens <file>]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NS, auraVersion, chromiumVersion, hash, hashInputs, partition, readInputs } from './lib/aura-surface.mjs';

const FORMAT = 1;
const SCHEMES = ['light', 'dark'];
const TYPES = ['color', 'dimension', 'shadow', 'background', 'fontFamily'];

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const dir = flag('dir', 'tokens/computed');
const tokensPath = flag('tokens', 'tokens/tokens.json');

const inputs = readInputs(tokensPath);
const { derived } = partition(inputs);
const expectedInputsHash = hashInputs(inputs);

const problems = { MISSING: [], STALE: [], EDITED: [], COVERAGE: [], MALFORMED: [] };
let checked = 0;

for (const scheme of SCHEMES) {
  const path = join(dir, `aura-${scheme}.computed.json`);
  let snapshot;
  try {
    snapshot = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    problems.MISSING.push(`${path}: ${error.code === 'ENOENT' ? 'no such file' : error.message}`);
    continue;
  }

  const generated = snapshot.$extensions?.[NS]?.generated;
  if (!generated) {
    // Without the header there is nothing to verify against, and no way to tell
    // a generated file from one somebody wrote by hand — which is the whole
    // distinction this artifact rests on.
    problems.MALFORMED.push(`${path}: no $extensions['${NS}'].generated header`);
    continue;
  }
  if (generated.format !== FORMAT) {
    problems.STALE.push(`${path}: format ${generated.format}, this checker speaks ${FORMAT}`);
    continue;
  }

  // --- generated, and from the right things ------------------------------
  if (generated.auraVersion !== auraVersion) {
    problems.STALE.push(
      `${path}: generated from @vaadin/aura@${generated.auraVersion}, the pinned release is ${auraVersion}`,
    );
  }
  if (chromiumVersion && generated.engine !== `Chromium ${chromiumVersion}`) {
    problems.STALE.push(
      `${path}: read by ${generated.engine}, the pinned Playwright launches Chromium ${chromiumVersion}`,
    );
  }
  if (generated.inputsHash !== expectedInputsHash) {
    problems.STALE.push(`${path}: generated from different inputs than ${tokensPath} holds now`);
  }
  if (generated.conditions?.colorScheme !== scheme) {
    problems.MALFORMED.push(`${path}: records colour scheme "${generated.conditions?.colorScheme}"`);
  }
  if (typeof generated.comparison?.tolerance !== 'number' || !generated.comparison?.space) {
    problems.MALFORMED.push(`${path}: no comparison space and tolerance for a verifier to use`);
  }

  // --- not hand-edited ---------------------------------------------------
  // The generator hashes everything it wrote; recomputing it here is what turns
  // "never hand-edit this file" from a comment into a failing build.
  const { bodyHash, ...header } = generated;
  const body = { ...snapshot, $extensions: { ...snapshot.$extensions, [NS]: { generated: header } } };
  if (!bodyHash) {
    problems.MALFORMED.push(`${path}: header carries no bodyHash`);
  } else if (hash(body) !== bodyHash) {
    problems.EDITED.push(`${path}: body hashes to ${hash(body)}, header claims ${bodyHash}`);
  }

  // --- covers Aura's derived surface -------------------------------------
  const computed = snapshot.computed ?? {};
  const accounted = new Set([...Object.keys(computed), ...(generated.unresolved ?? []).map((u) => u.cssVar)]);
  for (const name of derived) {
    if (!accounted.has(name)) {
      problems.COVERAGE.push(`${path}: Aura derives ${name} and the snapshot does not account for it`);
    }
  }
  for (const name of accounted) {
    if (derived.includes(name)) continue;
    problems.COVERAGE.push(
      inputs.has(name)
        ? `${path}: ${name} is an input (${inputs.get(name).token}) — the snapshot must not restate one`
        : `${path}: ${name} is not part of Aura's derived surface`,
    );
  }

  // --- every entry is marked derived and usable --------------------------
  for (const [name, token] of Object.entries(computed)) {
    const meta = token.$extensions?.[NS];
    if (meta?.derived !== true) {
      problems.MALFORMED.push(`${path}: ${name} is not marked derived`);
    }
    if (!TYPES.includes(token.$type)) {
      problems.MALFORMED.push(`${path}: ${name} has $type "${token.$type}"`);
    }
    if (token.$value === undefined || token.$value === '' || token.$value === null) {
      problems.MALFORMED.push(`${path}: ${name} has no $value`);
    }
    if (!Array.isArray(meta?.from)) {
      problems.MALFORMED.push(`${path}: ${name} does not record the inputs it came from`);
    }
    // A colour with no sRGB form cannot be compared against a sampled pixel,
    // which is the one thing the snapshot exists for.
    if (token.$type === 'color' && (!/^#[0-9a-f]{6}$/.test(meta?.srgb ?? '') || meta?.rgba?.length !== 4)) {
      problems.MALFORMED.push(`${path}: ${name} is a colour with no sRGB value to compare against`);
    }
    checked++;
  }
}

const total = Object.values(problems).flat().length;
if (total === 0) {
  console.log(
    `✓ ${dir}: ${SCHEMES.length} snapshots, ${checked} derived values, generated from ${tokensPath} ` +
      `against @vaadin/aura@${auraVersion}, covering all ${derived.length} derived properties`,
  );
  process.exit(0);
}

console.error(`\n✗ ${dir} does not describe the theme ${tokensPath} and @vaadin/aura@${auraVersion} produce\n`);
for (const [kind, list] of Object.entries(problems)) {
  if (list.length === 0) continue;
  console.error(`  ${kind} (${list.length}):`);
  for (const item of list.slice(0, 12)) console.error(`    - ${item}`);
  if (list.length > 12) console.error(`    … and ${list.length - 12} more`);
  console.error('');
}
console.error('Run `npm run snapshot` and commit the result — never edit the snapshot by hand.\n');
process.exit(1);
