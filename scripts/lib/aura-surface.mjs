/**
 * Shared reading of the Aura surface: which of its root custom properties are
 * inputs (transcribed in tokens/tokens.json) and which are derived in the
 * browser at runtime.
 *
 * The split here is the exact inverse of the one in check-aura-drift.mjs: a
 * declaration containing calc(), light-dark(), color-mix(), round(), clamp(),
 * relative-colour oklch(from …) or a var() reference cannot be a static DTCG
 * $value, so the drift check skips it as derived — and the computed snapshot
 * covers precisely that set. Together the two account for every public root
 * property, which is what check-computed-snapshot.mjs asserts.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export const NS = 'com.vaadin.aura';

const require = createRequire(import.meta.url);

export const auraDir = dirname(require.resolve('@vaadin/aura/package.json'));
export const auraVersion = require('@vaadin/aura/package.json').version;
export const auraEntry = join(auraDir, 'aura.css');

/**
 * The Chromium the pinned Playwright would launch, read from its manifest so
 * the snapshot checker can notice a renderer change without starting a browser.
 * A new Chromium can serialise a computed colour differently, or resolve one
 * differently, so a snapshot taken with an older one is stale in the same way a
 * snapshot of older inputs is.
 */
export const chromiumVersion = (() => {
  try {
    // Resolved through the package root: browsers.json is not in the package's
    // exports map, so it cannot be required by subpath.
    const root = dirname(require.resolve('playwright-core/package.json'));
    const manifest = JSON.parse(readFileSync(join(root, 'browsers.json'), 'utf8'));
    return manifest.browsers.find((b) => b.name === 'chromium')?.browserVersion ?? null;
  } catch {
    return null; // Playwright not installed: the generator is what needs it, not the checker
  }
})();

/** Aura's root stylesheets — src/*.css, the same set the drift check reads.
 *  src/components/*.css is deliberately out of scope: those declare
 *  component-level properties, not the root surface. */
const rootCss = () => {
  const src = join(auraDir, 'src');
  return readdirSync(src)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(src, f), 'utf8'))
    .join('\n');
};

/** name → every declaration of it, in source order. A property can be declared
 *  more than once (`--aura-app-background` is, once at :root and once inside
 *  `@scope`); provenance unions them, so nothing is missed just because the
 *  cascade picks the later one. */
export function declarations() {
  const map = new Map();
  for (const [, name, value] of rootCss().matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)) {
    const clean = value.replace(/\s+/g, ' ').trim();
    if (map.has(name)) map.get(name).push(clean);
    else map.set(name, [clean]);
  }
  return map;
}

const COMPUTED = /\b(calc|light-dark|color-mix|round|clamp|min|max)\s*\(|oklch\(\s*from/;

/** A declaration the browser has to evaluate before it names a value. */
export const isComputed = (value) => COMPUTED.test(value) || /var\(/.test(value);

// --- tokens --------------------------------------------------------------

function* walk(node, path = []) {
  if (node === null || typeof node !== 'object') return;
  if ('$value' in node) yield [path.join('.'), node];
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith('$')) yield* walk(child, [...path, key]);
  }
}

/** A CSS value for a token, so the snapshot is a snapshot of *these inputs*
 *  rather than of whatever Aura ships — which is what lets an overlay point the
 *  generator at its own resolved token file and get its branded surface. */
const cssValue = (value) => {
  if (Array.isArray(value)) return value.map((f) => (/\s/.test(f) ? `'${f}'` : f)).join(', ');
  return String(value);
};

/**
 * Reads a DTCG token file (base or overlay-resolved) and returns the inputs it
 * declares, keyed by the Aura custom property each maps to.
 */
export function readInputs(path) {
  const tokens = JSON.parse(readFileSync(path, 'utf8'));
  const byPath = new Map(walk(tokens));

  const resolve = (value, depth = 0) => {
    if (depth > 10) return value;
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      const target = byPath.get(value.slice(1, -1));
      if (!target) throw new Error(`${path}: dangling reference ${value}`);
      return resolve(target.$value, depth + 1);
    }
    return value;
  };

  const inputs = new Map();
  for (const [tokenPath, token] of byPath) {
    const cssVar = token.$extensions?.[NS]?.cssVar;
    if (!cssVar) continue;
    inputs.set(cssVar, { token: tokenPath, value: cssValue(resolve(token.$value)) });
  }
  return inputs;
}

/** A font stack, a number or a colour compared the way check-aura-drift.mjs
 *  compares them: quoting and whitespace are not a difference. */
export const normalise = (value) =>
  String(value)
    .replace(/\s+/g, ' ')
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .join(', ');

/** Expands var() references against Aura's own declarations, so an input Aura
 *  writes as `var(--aura-blue)` can be compared with the value a token holds. */
export function deref(value, declared, depth = 0) {
  if (depth > 10) return value;
  const expanded = String(value).replace(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g, (whole, name) =>
    declared.has(name) ? declared.get(name)[0] : whole,
  );
  return expanded === value ? value : deref(expanded, declared, depth + 1);
}

/**
 * The inputs that actually differ from what Aura itself declares — the only
 * ones worth emitting as CSS.
 *
 * Aura declares its inputs at zero specificity (`:where(:root)`) so that an
 * application can override them, but that also means an override at `:root`
 * beats Aura's own `@media (pointer: coarse)` and `[theme~='small']`
 * re-declarations of the same property. Emitting all 22 inputs would therefore
 * pin --aura-base-size and silently switch off every density adaptation, and the
 * snapshot would describe a theme nobody has. Emitting only the overrides keeps
 * untouched knobs on Aura's full cascade.
 */
export function overrides(inputs) {
  const declared = declarations();
  const out = new Map();
  for (const [name, input] of inputs) {
    const theirs = declared.has(name) ? normalise(deref(declared.get(name)[0], declared)) : null;
    if (theirs !== normalise(input.value)) out.set(name, input);
  }
  return out;
}

/** The declarations an overlay's theme/tokens.css emits for its overrides. */
export const inputsCss = (inputs) =>
  inputs.size === 0
    ? '/* every input matches Aura\'s own default */'
    : `:root {\n${[...inputs].map(([name, { value }]) => `  ${name}: ${value};`).join('\n')}\n}`;

/**
 * Partitions Aura's root properties against a set of inputs.
 *
 * internal   `--_*`: Aura's own scratch space, not a public property
 * input      claimed by a token, so its value is authored, not derived
 * derived    everything else the browser has to compute — the snapshot's scope
 */
export function partition(inputs) {
  const declared = declarations();
  const internal = [];
  const inputProps = [];
  const derived = [];
  const authored = [];

  for (const [name, values] of declared) {
    if (name.startsWith('--_')) internal.push(name);
    else if (inputs.has(name)) inputProps.push(name);
    else if (values.some(isComputed)) derived.push(name);
    else authored.push(name); // a public static value with no token: check-aura-drift's UNTRANSCRIBED
  }
  return { declared, internal, inputs: inputProps, derived: derived.sort(), authored };
}

/**
 * Input tokens a derived property depends on, found by expanding var()
 * references through every declaration of every property it touches.
 */
export function provenance(name, declared, inputs) {
  const seen = new Set();
  const from = new Set();
  const visit = (prop) => {
    if (seen.has(prop)) return;
    seen.add(prop);
    for (const value of declared.get(prop) ?? []) {
      for (const [, ref] of value.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)) {
        if (inputs.has(ref)) from.add(inputs.get(ref).token);
        else visit(ref);
      }
    }
  };
  visit(name);
  return [...from].sort();
}

// --- hashing -------------------------------------------------------------

/** Key-sorted JSON, so a hash covers meaning rather than key order or
 *  whitespace: reformatting the snapshot is fine, changing a value is not. */
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export const hash = (value) => `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`;

/** Hash of the inputs a snapshot was generated from. Any change to an authored
 *  token moves this, which is how a stale snapshot fails the build. */
export const hashInputs = (inputs) =>
  hash([...inputs].map(([name, { token, value }]) => [name, token, value]).sort());
