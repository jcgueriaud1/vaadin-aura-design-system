#!/usr/bin/env node
/**
 * The design-sync project claims to show every component the design system
 * supports. That claim is only worth something if it fails when it stops being
 * true — a Vaadin release that adds a component would otherwise leave a card
 * nobody knows is missing, which is the same silent-rot failure
 * `check-aura-drift.mjs` exists to prevent for the tokens.
 *
 * So this walks the installed package rather than the config, in both directions:
 *
 *   UNCOVERED     in the kit, but no card, no `covers`, no `omitted` reason
 *   UNTRANSCRIBED the package exports it and the kit does not list it
 *   VANISHED      the kit lists it and the package no longer exports it
 *
 * It also checks what the compiler cannot see about the story files themselves:
 * that each card has one, that its `__order` and its stories agree, and that the
 * stories obey the DESIGN.md rules the examples are held to.
 *
 * Usage: check-showcase.mjs [config=.design-sync/config.json]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const configPath = process.argv[2] ?? join('.design-sync', 'config.json');
const inputs = dirname(configPath);
const require = createRequire(import.meta.url);

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const { kit = [], omitted = {}, components = [], guidelines = [] } = config;

const problems = [];
const report = (message) => problems.push(message);

/** What the installed package actually exports: one module per component. */
const packageDir = dirname(require.resolve('@vaadin/react-components/package.json'));
const exported = readdirSync(packageDir)
  .filter((file) => file.endsWith('.js') && file !== 'index.js')
  .map((file) => file.replace(/\.js$/, ''))
  .sort();

if (exported.length === 0) {
  report('found no components in @vaadin/react-components — the check would pass vacuously');
}
if (components.length === 0) {
  report(`${configPath} declares no cards — the check would pass vacuously`);
}

// 1. The kit and the package agree, in both directions.
for (const name of exported) {
  if (!kit.includes(name)) report(`UNTRANSCRIBED  ${name} is in @vaadin/react-components and not in config.kit`);
}
for (const name of kit) {
  if (!exported.includes(name)) report(`VANISHED       ${name} is in config.kit and no longer in @vaadin/react-components`);
}

// 2. Every kit component is accounted for: a card, another card's `covers`, or
//    an omission with a reason.
const carded = new Map(components.map((component) => [component.name, component]));
const covered = new Map();
for (const component of components) {
  for (const name of component.covers ?? []) {
    if (!kit.includes(name)) report(`${component.name}.covers names ${name}, which is not in config.kit`);
    if (covered.has(name)) report(`${name} is covered twice: by ${covered.get(name)} and by ${component.name}`);
    covered.set(name, component.name);
  }
}

for (const name of kit) {
  const claims = [
    carded.has(name) && 'a card',
    covered.has(name) && `covered by ${covered.get(name)}`,
    omitted[name] && 'omitted',
  ].filter(Boolean);

  if (claims.length === 0) report(`UNCOVERED      ${name} has no card, no covers entry and no omission reason`);
  if (claims.length > 1) report(`${name} is claimed twice over: ${claims.join(' and ')}`);
}

for (const [name, reason] of Object.entries(omitted)) {
  if (!kit.includes(name)) report(`omitted names ${name}, which is not in config.kit`);
  if (!reason || reason.length < 20) report(`omitted.${name} needs a reason, not "${reason}"`);
}

// 3. Each card's stories exist, are ordered, and obey DESIGN.md.
for (const component of components) {
  const { name, group, source } = component;
  if (!group) report(`${name} has no group — the pane has nowhere to put its card`);

  if (source && !existsSync(source)) {
    report(`${name}.source points at ${source}, which does not exist`);
  }

  // previews/ drives a curated example; showcase/ is written against the API.
  const dir = source ? 'previews' : 'showcase';
  const storiesPath = join(inputs, dir, `${name}.tsx`);
  if (!existsSync(storiesPath)) {
    report(`${name} has no stories at ${storiesPath}`);
    continue;
  }

  const stories = readFileSync(storiesPath, 'utf8');
  const exports = [...stories.matchAll(/^export const (\w+)/gm)].map((match) => match[1]);
  const told = exports.filter((story) => /^[A-Z]/.test(story));

  if (told.length === 0) report(`${storiesPath} exports no stories — the card would render empty`);

  // The card sorts declared order first and everything else alphabetically after
  // it, so a story missing from __order silently lands last.
  const declared = stories.match(/__order = \[([^\]]*)\]/);
  if (!declared) {
    report(`${storiesPath} has no __order — exports arrive alphabetically from the bundler`);
  } else {
    const listed = [...declared[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
    for (const story of told) {
      if (!listed.includes(story)) report(`${storiesPath}: ${story} is missing from __order`);
    }
    for (const story of listed) {
      if (!told.includes(story)) report(`${storiesPath}: __order names ${story}, which is not exported`);
    }
  }

  // DESIGN.md §2 and §4, on the same terms as scripts/check-examples.mjs. A
  // story is read as authority too — it is shipped into the card folder.
  for (const match of stories.matchAll(/--lumo-[\w-]+|@vaadin\/react-components\/css\/lumo\/[\w./]+/g)) {
    report(`${storiesPath}: references Lumo: ${match[0]}`);
  }
  for (const match of stories.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/g)) {
    report(`${storiesPath}: hardcoded colour: ${match[0]}`);
  }
}

// 4. Guidelines are hand-written cards; they still need a group and a path.
for (const guideline of guidelines) {
  if (!guideline.path || !guideline.group) report(`guideline ${guideline.name ?? '?'} needs both a path and a group`);
}

if (problems.length === 0) {
  const showcases = components.filter((component) => !component.source).length;
  console.log(
    `✓ .design-sync/: ${components.length} cards (${components.length - showcases} examples, ${showcases} showcases) ` +
      `cover all ${kit.length} components of @vaadin/react-components`,
  );
  process.exit(0);
}

console.error(`\n✗ ${configPath} and @vaadin/react-components disagree\n`);
for (const problem of problems) console.error(`    ${problem}`);
console.error('');
process.exit(1);
