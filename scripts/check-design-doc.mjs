#!/usr/bin/env node
/**
 * DESIGN.md tells agents which custom properties and helper classes to use. A
 * name that Aura renamed or dropped is worse than no guidance: it reads as
 * authoritative and silently resolves to nothing at runtime. This checks every
 * name the document recommends against the pinned Aura release.
 *
 * `--lumo-*` is exempt — the document names it precisely to forbid it.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const docPath = process.argv[2] ?? 'DESIGN.md';
const doc = readFileSync(docPath, 'utf8');

const require = createRequire(import.meta.url);
const auraDir = dirname(require.resolve('@vaadin/aura/package.json'));
const auraVersion = require('@vaadin/aura/package.json').version;
const srcDir = join(auraDir, 'src');

const css = [
  readFileSync(join(auraDir, 'aura.css'), 'utf8'),
  ...readdirSync(srcDir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(srcDir, f), 'utf8')),
  ...readdirSync(join(srcDir, 'components'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(srcDir, 'components', f), 'utf8')),
].join('\n');

const definedProps = new Set([...css.matchAll(/(--[a-zA-Z][\w-]*)\s*:/g)].map((m) => m[1]));
const definedClasses = new Set([...css.matchAll(/\.(aura-[\w-]+)/g)].map((m) => m[1]));

// DESIGN.md compresses ramps as `--vaadin-gap-xs|s|m|l|xl`; expand to real names.
const cited = new Set();
for (const [match] of doc.matchAll(/--[a-zA-Z][\w-]*(?:\|[a-z][\w-]*)*/g)) {
  if (!match.includes('|')) {
    cited.add(match);
    continue;
  }
  const head = match.slice(0, match.indexOf('|'));
  const stem = head.slice(0, head.lastIndexOf('-') + 1);
  cited.add(head);
  for (const suffix of match.slice(match.indexOf('|') + 1).split('|')) cited.add(stem + suffix);
}

const citedClasses = new Set([...doc.matchAll(/`\.(aura-[\w-]+)`/g)].map((m) => m[1]));

const missingProps = [...cited].filter((p) => !p.startsWith('--lumo-') && !definedProps.has(p)).sort();
const missingClasses = [...citedClasses].filter((c) => !definedClasses.has(c)).sort();

if (missingProps.length === 0 && missingClasses.length === 0) {
  console.log(
    `✓ ${docPath}: ${cited.size} properties and ${citedClasses.size} classes all exist in @vaadin/aura@${auraVersion}`,
  );
  process.exit(0);
}

console.error(`\n✗ ${docPath} recommends names @vaadin/aura@${auraVersion} does not define\n`);
for (const p of missingProps) console.error(`    property  ${p}`);
for (const c of missingClasses) console.error(`    class     .${c}`);
console.error('');
process.exit(1);
