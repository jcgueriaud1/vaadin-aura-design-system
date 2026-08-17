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

console.log(`✓ ${source}: ${tokens.length} tokens, valid DTCG, all references resolve`);
