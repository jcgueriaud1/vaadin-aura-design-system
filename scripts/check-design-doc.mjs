#!/usr/bin/env node
/**
 * The docs tell agents which custom properties and helper classes to use. A name
 * that was renamed or dropped is worse than no guidance: it reads as
 * authoritative and silently resolves to nothing at runtime. This checks every
 * name a document recommends against the pinned release.
 *
 *   check-design-doc.mjs [doc]      default DESIGN.md
 *
 * Two sources of truth, because a design system's vocabulary spans both:
 *
 *   @vaadin/aura's CSS            the theme's own properties (--aura-*, and the
 *                                 --vaadin-* ones Aura re-points)
 *   the components' Lit styles    per-component knobs that live in shadow DOM
 *                                 and are declared in JS, never in the theme
 *
 * The second source was added because the first one alone gets a real property
 * wrong. `--vaadin-field-default-width` is the documented way to move a field's
 * width, and it is declared only in @vaadin/field-base's Lit styles — so a
 * checker reading Aura alone would reject the correct name and confirm a
 * consumer's guess that the property does not exist. That happened; see issue
 * #15, item 7.
 *
 * `--lumo-*` is exempt — the document names it precisely to forbid it.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
  ...componentStyles(),
].join('\n');

/**
 * Every `src/styles/*.js` under the @vaadin packages the kit resolves through.
 * These are Lit `css` templates, so the property names sit in ordinary CSS text
 * inside a template literal and the same `--name:` scan finds them.
 *
 * Read from @vaadin/react-components' own dependency tree rather than a glob of
 * node_modules, so the corpus is the pinned kit and not whatever else is
 * installed.
 */
function componentStyles() {
  const vaadinDir = dirname(dirname(require.resolve('@vaadin/react-components/package.json')));
  const out = [];
  for (const pkg of readdirSync(vaadinDir)) {
    const dir = join(vaadinDir, pkg, 'src', 'styles');
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (file.endsWith('.js')) out.push(readFileSync(join(dir, file), 'utf8'));
    }
  }
  if (out.length === 0) {
    console.error('\n✗ found no @vaadin/*/src/styles/*.js — the component vocabulary would be unchecked\n');
    process.exit(1);
  }
  return out;
}

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
    `✓ ${docPath}: ${cited.size} properties and ${citedClasses.size} classes all exist in ` +
      `@vaadin/aura@${auraVersion} or the components' own styles`,
  );
  process.exit(0);
}

console.error(`\n✗ ${docPath} recommends names @vaadin/aura@${auraVersion} and its components do not define\n`);
for (const p of missingProps) console.error(`    property  ${p}`);
for (const c of missingClasses) console.error(`    class     .${c}`);
console.error('');
process.exit(1);
