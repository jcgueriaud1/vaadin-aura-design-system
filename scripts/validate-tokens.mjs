#!/usr/bin/env node
/**
 * Validates a DTCG token file: parses as DTCG, and every {reference} resolves
 * within this repo alone.
 *
 * Style Dictionary only resolves references while building a platform. With
 * `platforms: {}` a file full of dangling references initialises perfectly
 * cleanly — so we format a throwaway CSS platform in memory. formatPlatform
 * resolves and formats without touching disk; nothing is written.
 *
 * Usage: node scripts/validate-tokens.mjs [file]   (default tokens/tokens.json)
 */
import { existsSync } from 'node:fs';
import StyleDictionary from 'style-dictionary';

const source = process.argv[2] ?? 'tokens/tokens.json';

// Style Dictionary treats a missing source as an empty token set and reports
// success, so a renamed file would validate perfectly. Check it ourselves.
if (!existsSync(source)) {
  console.error(`✗ ${source}: no such file`);
  process.exit(1);
}

const sd = new StyleDictionary({
  usesDtcg: true,
  log: { verbosity: 'verbose' },
  source: [source],
  platforms: {
    _validate: {
      transformGroup: 'css',
      files: [{ destination: 'unused.css', format: 'css/variables' }],
    },
  },
});

// Style Dictionary announces the formatted file on stdout, which reads as if we
// wrote one. Silence it on the happy path; errors go to stderr and still show.
const log = console.log;
console.log = () => {};
let tokens;
try {
  await sd.hasInitialized;
  await sd.formatPlatform('_validate');
  tokens = (await sd.getPlatformTokens('_validate')).allTokens;
} catch (error) {
  console.log = log;
  console.error(`\n✗ ${source} is not valid\n`);
  console.error(error.message);
  process.exit(1);
}
console.log = log;

// Same class of silent pass: `{}` is valid DTCG and resolves trivially.
if (tokens.length === 0) {
  console.error(`✗ ${source}: contains no tokens`);
  process.exit(1);
}

// --- Layering contract -------------------------------------------------
// The overlay's resolve.mjs rejects overrides that target anything but the
// semantic layer, so it needs to classify every token it is handed. A token
// with no layer is unclassifiable, which is why a missing marker is an error
// rather than an implicit default.
const NS = 'com.vaadin.aura';
const LAYERS = ['primitive', 'semantic'];

const layerOf = (token) => token.$extensions?.[NS]?.layer;
const layers = new Map(tokens.map((t) => [t.path.join('.'), layerOf(t)]));
const cssVars = new Map();
const errors = [];

for (const token of tokens) {
  const path = token.path.join('.');
  const layer = layers.get(path);

  if (layer === undefined) {
    errors.push(`${path}: no $extensions['${NS}'].layer — every token must declare its layer`);
    continue;
  }
  if (!LAYERS.includes(layer)) {
    errors.push(`${path}: layer "${layer}" is not one of ${LAYERS.join(' | ')}`);
    continue;
  }

  // Semantic tokens are exactly the tokens emitted as Aura custom properties,
  // so each must name the property it maps to. Without it the overlay would
  // need its own token-path -> CSS-variable table, duplicating knowledge the
  // base owns; and Style Dictionary's derived names do not match Aura's.
  const cssVar = token.$extensions?.[NS]?.cssVar;
  if (layer === 'semantic') {
    if (cssVar === undefined) {
      errors.push(`${path}: semantic token has no cssVar — it would never be emitted`);
    } else if (!cssVar.startsWith('--')) {
      errors.push(`${path}: cssVar "${cssVar}" is not a custom property name`);
    } else if (cssVars.has(cssVar)) {
      errors.push(`${path}: cssVar "${cssVar}" already claimed by ${cssVars.get(cssVar)}`);
    } else {
      cssVars.set(cssVar, path);
    }
  } else if (cssVar !== undefined) {
    // Primitives are the internal ramp. Emitting one would hand overlays a
    // locked custom property they can see but are forbidden to change.
    errors.push(`${path}: primitive declares cssVar "${cssVar}" — primitives are not emitted`);
  }

  // A primitive pointing at a semantic token inverts the layering: overriding
  // that semantic token in an overlay would then silently move a primitive,
  // which is exactly what the contract exists to prevent.
  if (layer === 'primitive') {
    const raw = token.original?.$value;
    const refs = typeof raw === 'string' ? [...raw.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]) : [];
    for (const ref of refs) {
      if (layers.get(ref) === 'semantic') {
        errors.push(`${path}: primitive references semantic token {${ref}} — layering inverted`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`\n✗ ${source}: layering contract violated\n`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

const semantic = [...layers.values()].filter((l) => l === 'semantic').length;
console.log(
  `✓ ${source}: ${tokens.length} tokens (${semantic} semantic → ${cssVars.size} CSS properties, ` +
    `${tokens.length - semantic} primitive), valid DTCG, all references resolve, layering contract holds`,
);
