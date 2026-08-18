#!/usr/bin/env node
/**
 * The examples in `components/` are read as authority: an agent that finds a
 * hardcoded `#4a90d9` there learns that hardcoding is fine, and an example
 * carrying a stale "verified against" line claims a guarantee nobody checked.
 * So the same rules DESIGN.md sets for application code are enforced on the
 * examples themselves.
 *
 * What this cannot check is whether the API is real — that is `tsc`, run as
 * `npm run check:components`. This checks what the compiler is blind to.
 *
 * Usage: check-examples.mjs [dir=components]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'components';
const require = createRequire(import.meta.url);

// The version an example claims is checked against the one actually installed,
// and the installed one is only meaningful if it can't move on its own — so the
// exact pin is part of the check rather than an assumption behind it.
const pinned = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
  .devDependencies?.['@vaadin/react-components'];
if (!/^\d+\.\d+\.\d+$/.test(pinned ?? '')) {
  console.error(
    `\n✗ @vaadin/react-components must be pinned exactly in package.json, found "${pinned}"\n`,
  );
  process.exit(1);
}

const installed = require('@vaadin/react-components/package.json').version;
if (installed !== pinned) {
  console.error(`\n✗ package.json pins ${pinned} but ${installed} is installed — run npm ci\n`);
  process.exit(1);
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.tsx'))
  .sort();

if (files.length === 0) {
  console.error(`\n✗ ${dir}/ contains no examples — the check would pass vacuously\n`);
  process.exit(1);
}

/** `style={{ … }}` regions, where a literal really is a design system value. */
function styleObjects(source) {
  const regions = [];
  for (const match of source.matchAll(/style=\{\{/g)) {
    let depth = 2;
    let i = match.index + match[0].length;
    for (; i < source.length && depth > 0; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') depth--;
    }
    regions.push({ text: source.slice(match.index, i), offset: match.index });
  }
  return regions;
}

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

const problems = [];
const report = (file, line, message) => problems.push(`${file}:${line}  ${message}`);

for (const file of files) {
  const path = join(dir, file);
  const source = readFileSync(path, 'utf8');

  // DESIGN.md §2 — Aura is the theme. Lumo properties resolve to nothing.
  for (const match of source.matchAll(/--lumo-[\w-]+|@vaadin\/react-components\/css\/lumo\/[\w./]+/g)) {
    report(file, lineOf(source, match.index), `references Lumo: ${match[0]}`);
  }

  // Every example states the version it was verified against, and that
  // statement has to be true — a bump of the dependency invalidates it.
  const claimed = source.match(/Verified against @vaadin\/react-components@(\d+(?:\.\d+)+)/);
  if (!claimed) {
    report(file, 1, 'no "Verified against @vaadin/react-components@<version>" line');
  } else if (claimed[1] !== pinned) {
    report(file, lineOf(source, claimed.index), `claims ${claimed[1]}, repo pins ${pinned}`);
  }

  // DESIGN.md §4 — never hardcode a colour. Applies to the whole file: a hex
  // in a helper function is as wrong as one in a style object.
  for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/g)) {
    report(file, lineOf(source, match.index), `hardcoded colour: ${match[0]}`);
  }

  // …and never a hardcoded length, in the one place a length is design system
  // spacing. `0` and `1px` hairlines are the exceptions DESIGN.md allows;
  // percentages and viewport units aren't spacing at all.
  for (const region of styleObjects(source)) {
    for (const match of region.text.matchAll(/\b\d*\.?\d+(?:px|rem|em)\b/g)) {
      if (match[0] === '1px') continue;
      report(file, lineOf(source, region.offset + match.index), `hardcoded length: ${match[0]}`);
    }
  }
}

// The render harness is the only thing that proves an example runs rather than
// merely compiles, and it proves nothing about an example it never mounts.
const harnessPath = 'sandbox/main.tsx';
const harness = readFileSync(harnessPath, 'utf8');
const mounted = new Set(
  [...harness.matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\.\/components\/[^']+'/g)]
    .flatMap((match) => match[1].split(','))
    .map((name) => name.trim())
    .filter(Boolean),
);

for (const file of files) {
  const source = readFileSync(join(dir, file), 'utf8');
  for (const match of source.matchAll(/^export function (\w+)/gm)) {
    if (!mounted.has(match[1])) {
      report(file, lineOf(source, match.index), `${match[1]} is never mounted in ${harnessPath}`);
    }
  }
}

if (problems.length === 0) {
  console.log(
    `✓ ${dir}/: ${files.length} examples, all mounted in ${harnessPath}, Aura-only and verified against @vaadin/react-components@${pinned}`,
  );
  process.exit(0);
}

console.error(`\n✗ ${dir}/ breaks the rules DESIGN.md sets for application code\n`);
for (const problem of problems) console.error(`    ${problem}`);
console.error('');
process.exit(1);
