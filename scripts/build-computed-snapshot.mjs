#!/usr/bin/env node
/**
 * Generates the computed-token snapshot: concrete values for the 66 root
 * properties Aura derives in the browser rather than declares.
 *
 * tokens/tokens.json holds Aura's inputs, which is enough to *build* a theme
 * and not enough to *verify* one — `aura.contrast-level: 1` is not a colour.
 * The real value of --vaadin-text-color only exists after light-dark(),
 * oklch(from …) and color-mix() have been evaluated, so this loads Aura in
 * headless Chromium and reads them back.
 *
 * The snapshot is NEVER authoritative and never hand-edited: it is regenerated
 * from the inputs, and check-computed-snapshot.mjs (no browser needed) rejects
 * a file whose recorded input hash, Aura version or body hash no longer match.
 *
 * Usage:
 *   node scripts/build-computed-snapshot.mjs [options]
 *     --tokens <file>   DTCG inputs (default tokens/tokens.json). An overlay
 *                       points this at its own tokens.resolved.json.
 *     --out <dir>       output directory (default tokens/computed)
 *     --scheme <s>      light | dark | both   (default both)
 *     --theme <name>    density variant, e.g. small — probes inside
 *                       [theme~='<name>'] instead of the default density
 *     --pointer <p>     fine | coarse         (default fine)
 *     --check           do not write; fail if what is on disk differs
 *     --no-verify       skip the screenshot cross-check
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import {
  NS,
  auraDir,
  auraVersion,
  canonical,
  hash,
  hashInputs,
  inputsCss,
  overrides,
  partition,
  provenance,
  readInputs,
} from './lib/aura-surface.mjs';

const FORMAT = 1;

// A sampled pixel is 8-bit sRGB, so that is the space the snapshot promises to
// be comparable in. 2/255 per channel absorbs the rounding of an oklab → sRGB
// conversion and of compositing a translucent value; anything larger is a real
// difference. Verified against real screenshots by --verify below.
const TOLERANCE = 2;

// --- arguments -----------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const tokensPath = flag('tokens', 'tokens/tokens.json');
const outDir = flag('out', 'tokens/computed');
const theme = flag('theme', null);
const pointer = flag('pointer', 'fine');
const scheme = flag('scheme', 'both');
const schemes = scheme === 'both' ? ['light', 'dark'] : [scheme];
const check = argv.includes('--check');
const verify = !argv.includes('--no-verify');

if (!['fine', 'coarse'].includes(pointer)) {
  console.error(`✗ --pointer must be fine or coarse, got "${pointer}"`);
  process.exit(1);
}
for (const s of schemes) {
  if (!['light', 'dark'].includes(s)) {
    console.error(`✗ --scheme must be light, dark or both, got "${s}"`);
    process.exit(1);
  }
}

// The default density is what the committed snapshot describes; a variant is a
// deliberate, named run, and its file says so in the name.
const variant = [theme && `theme-${theme}`, pointer === 'coarse' && 'pointer-coarse'].filter(Boolean).join('-');
const fileFor = (s) => join(outDir, `aura-${s}${variant ? `-${variant}` : ''}.computed.json`);

// --- inputs --------------------------------------------------------------
const inputs = readInputs(tokensPath);
const { declared, derived } = partition(inputs);
const inputsHash = hashInputs(inputs);
// Only the inputs that differ from Aura's defaults are emitted as CSS; see
// overrides() for why emitting all of them would break density adaptation.
const applied = overrides(inputs);

// --- the probe page ------------------------------------------------------
// Probing happens on an element inside <body>, not on :root, because that is
// where application content lives: --vaadin-radius-s is min(0.25lh, …), and lh
// at :root is the browser default line-height rather than Aura's.
const probePage = `<!doctype html>
<html><head>
<link rel="stylesheet" href="/aura.css">
<style>
  :root { color-scheme: light dark; }
  ${inputsCss(applied)}
  /* Sentinel: an inherited property that falls back to this is unresolvable. */
  #context { font-family: '__unresolved__'; }
  #swatches { display: flex; flex-wrap: wrap; margin: 0; background: #fff; }
  .swatch { width: 20px; height: 20px; }
  .ruler { height: 4px; background: #000; }
</style>
</head><body style="margin:0">
<div id="context"${theme ? ` theme="${theme}"` : ''}><div id="probe"></div></div>
<canvas id="canvas" width="1" height="1"></canvas>
</body></html>`;

const browser = await chromium.launch();
const context = await browser.newContext({
  colorScheme: schemes[0],
  // Touch support is what flips (pointer: coarse); Playwright's isMobile would
  // also switch to a 980px mobile layout viewport, which puts CSS pixels and
  // screenshot pixels out of step and breaks the cross-check below.
  hasTouch: pointer === 'coarse',
  deviceScaleFactor: 1,
  viewport: { width: 800, height: 600 },
});
// Aura is served over http rather than opened over file://: a file:// page may
// not pull in a stylesheet from another directory, and setContent's about:blank
// origin may not pull in file:// at all — either way Aura would silently not
// load and every property would read as unresolved.
const ORIGIN = 'http://aura.invalid';
const MIME = { '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml' };

await context.route(`${ORIGIN}/**`, (route) => {
  const { pathname } = new URL(route.request().url());
  if (pathname === '/probe.html') {
    return route.fulfill({ contentType: 'text/html', body: probePage });
  }
  const file = join(auraDir, normalize(pathname).replace(/^[/\\]+/, ''));
  if (!file.startsWith(auraDir)) return route.abort();
  try {
    return route.fulfill({ contentType: MIME[extname(file)] ?? 'application/octet-stream', body: readFileSync(file) });
  } catch {
    return route.fulfill({ status: 404, body: '' });
  }
});

const page = await context.newPage();
page.on('pageerror', (error) => {
  console.error(`✗ page error while probing: ${error.message}`);
  process.exitCode = 1;
});
const load = async () => {
  await page.goto(`${ORIGIN}/probe.html`, { waitUntil: 'load' });
  // Aura must actually be in effect; without it every property reads as
  // unresolved and the snapshot would be a file full of nothing.
  const auraLoaded = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--vaadin-aura-theme').trim(),
  );
  if (auraLoaded !== '1') throw new Error('the Aura stylesheet did not load in the probe page');
};
await load();

const engine = `Chromium ${browser.version()}`;

// pointer: coarse is emulated through touch support; refuse to write a file
// labelled coarse if the media query did not actually flip.
if (pointer === 'coarse') {
  const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
  if (!coarse) {
    console.error('✗ --pointer coarse requested but (pointer: coarse) does not match in this browser');
    await browser.close();
    process.exit(1);
  }
}

const results = new Map();

for (const colorScheme of schemes) {
  await page.emulateMedia({ colorScheme });

  const probed = await page.evaluate((names) => {
    const probe = document.getElementById('probe');
    const canvas = document.getElementById('canvas').getContext('2d', { willReadFrequently: true });

    // Registered custom properties compute: assigning a var() reference to one
    // resolves light-dark(), color-mix() and relative colour into a value, and
    // an unresolvable value falls back to a sentinel initial we can recognise.
    const SENTINEL_COLOR = 'rgb(1, 2, 3)';
    const SENTINEL_LENGTH = '-99999px';
    for (const [name, syntax, initialValue] of [
      ['--probe-color', '<color>', SENTINEL_COLOR],
      ['--probe-length', '<length>', SENTINEL_LENGTH],
    ]) {
      try {
        CSS.registerProperty({ name, syntax, inherits: false, initialValue });
      } catch {
        /* already registered on a second pass */
      }
    }

    const read = (name, property) => {
      probe.style.cssText = '';
      probe.style.setProperty(property, `var(${name})`);
      return getComputedStyle(probe).getPropertyValue(property);
    };

    // 8-bit sRGB, the space a screenshot is sampled in. Canvas is the same
    // conversion the compositor applies, which --verify proves.
    const toSrgb = (value) => {
      canvas.clearRect(0, 0, 1, 1);
      canvas.fillStyle = '#000';
      canvas.fillStyle = value;
      if (canvas.fillStyle === '#000000' && !/^#0{3,6}$|black|rgb\(0, 0, 0\)/i.test(value)) return null;
      canvas.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;
      return { rgba: [r, g, b, Math.round((a / 255) * 1000) / 1000], hex: `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}` };
    };

    const out = {};
    for (const name of names) {
      // Empty means the property is not defined here at all — declared only
      // inside an at-rule this snapshot's conditions do not match.
      if (getComputedStyle(probe).getPropertyValue(name).trim() === '') {
        out[name] = { kind: 'undefined' };
        continue;
      }

      const color = read(name, '--probe-color');
      if (color && color !== SENTINEL_COLOR) {
        out[name] = { kind: 'color', value: color, srgb: toSrgb(color) };
        continue;
      }
      const length = read(name, '--probe-length');
      if (length && length !== SENTINEL_LENGTH) {
        out[name] = { kind: 'dimension', value: length };
        continue;
      }
      const shadow = read(name, 'box-shadow');
      if (shadow && shadow !== 'none') {
        out[name] = { kind: 'shadow', value: shadow };
        continue;
      }
      // The background shorthand: an image list, optionally with a colour.
      probe.style.cssText = '';
      probe.style.setProperty('background', `var(${name})`);
      const style = getComputedStyle(probe);
      const image = style.backgroundImage;
      const backgroundColor = style.backgroundColor;
      if (image !== 'none') {
        out[name] = {
          kind: 'background',
          value: image,
          backgroundColor: backgroundColor === 'rgba(0, 0, 0, 0)' ? null : backgroundColor,
        };
        continue;
      }
      const family = read(name, 'font-family');
      if (family && family !== `'__unresolved__'` && family !== '"__unresolved__"') {
        out[name] = { kind: 'fontFamily', value: family };
        continue;
      }
      out[name] = { kind: 'unresolved' };
    }
    return out;
  }, derived);

  // --- assemble ----------------------------------------------------------
  const computed = {};
  const unresolved = [];

  for (const name of derived) {
    const result = probed[name];
    const from = provenance(name, declared, inputs);
    const meta = { derived: true, from };

    if (result.kind === 'undefined' || result.kind === 'unresolved') {
      unresolved.push({
        cssVar: name,
        reason:
          result.kind === 'undefined'
            ? 'not defined under these conditions — Aura declares it only inside an at-rule this snapshot does not match'
            : 'defined, but resolves to no colour, length, shadow, background or font stack',
        declared: declared.get(name),
      });
      continue;
    }

    if (result.kind === 'color') {
      computed[name] = {
        $type: 'color',
        $value: result.value,
        $extensions: {
          [NS]: {
            ...meta,
            srgb: result.srgb?.hex ?? null,
            rgba: result.srgb?.rgba ?? null,
            alpha: result.srgb ? result.srgb.rgba[3] : null,
          },
        },
      };
    } else if (result.kind === 'fontFamily') {
      computed[name] = {
        $type: 'fontFamily',
        $value: result.value.split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, '')),
        $extensions: { [NS]: meta },
      };
    } else if (result.kind === 'background') {
      computed[name] = {
        $type: 'background',
        $value: result.value,
        $extensions: { [NS]: { ...meta, backgroundColor: result.backgroundColor } },
      };
    } else {
      computed[name] = {
        $type: result.kind, // dimension | shadow
        $value: result.value,
        $extensions: { [NS]: meta },
      };
    }
  }

  const snapshot = {
    $description:
      `GENERATED FILE — DO NOT EDIT. Computed values of the ${Object.keys(computed).length} root custom ` +
      `properties @vaadin/aura@${auraVersion} derives at runtime, in the ${colorScheme} colour scheme, read ` +
      `from a browser after light-dark(), oklch(from …), color-mix() and round() were evaluated. Generated ` +
      `from ${tokensPath}; if the two disagree, this file is wrong by definition. Regenerate with ` +
      `\`npm run snapshot\` — \`npm run check:snapshot\` rejects a stale or hand-edited copy. Not a token ` +
      `source: it is never fed to Style Dictionary and overlays never override it.`,
    $extensions: {
      [NS]: {
        generated: {
          format: FORMAT,
          by: 'scripts/build-computed-snapshot.mjs',
          engine,
          auraVersion,
          inputs: tokensPath,
          inputsHash,
          // Empty for the base: check:aura guarantees the tokens match Aura, so
          // the base snapshot is unbranded Aura. An overlay's run lists exactly
          // the brand overrides that shaped these values.
          overriding: [...applied.keys()],
          conditions: {
            colorScheme,
            colorSchemeMechanism: '`color-scheme: light dark` on :root plus the matching prefers-color-scheme',
            density: theme ?? 'default',
            pointer,
            probe: "a <div> inside <body>, so lh-relative values resolve against Aura's content line-height",
          },
          comparison: {
            space: 'srgb',
            encoding: '8-bit per channel',
            tolerance: TOLERANCE,
            note:
              'Compare against `srgb`/`rgba`, not `$value`: a sampled pixel is sRGB while $value keeps the ' +
              'colour space the browser computed in (oklch, oklab, color(srgb …)). Where alpha < 1, composite ' +
              'over the surface behind the element before comparing.',
          },
          unresolved,
        },
      },
    },
    computed,
  };

  const bodyHash = hash(snapshot);
  snapshot.$extensions[NS].generated.bodyHash = bodyHash;
  results.set(colorScheme, snapshot);
}

// --- cross-check against real pixels -------------------------------------
// The point of the snapshot is to be comparable with a rendered pixel, so the
// generator proves that on every colour and every length it emits rather than
// asserting it: paint each value, screenshot, sample, compare.
let verified = null;
if (verify) {
  verified = [];
  for (const [colorScheme, snapshot] of results) {
    await page.emulateMedia({ colorScheme });
    const entries = Object.entries(snapshot.computed);
    const colors = entries.filter(([, t]) => t.$type === 'color');
    const dimensions = entries.filter(([, t]) => t.$type === 'dimension');

    const sampled = await page.evaluate(
      async ({ colorNames, dimensionNames }) => {
        // Painted inside the same #context element the values were probed in,
        // so a density variant renders at the density it was read at.
        // Swatches on opaque white: a translucent derived colour composites,
        // which is exactly the case the tolerance note describes.
        document.getElementById('context').innerHTML =
          `<div id="swatches">${colorNames
            .map((n) => `<div class="swatch" style="background:var(${n})"></div>`)
            .join('')}</div>` +
          dimensionNames.map((n) => `<div class="ruler" style="width:var(${n})"></div>`).join('');
        document.body.style.background = '#fff';

        const boxes = {
          colors: [...document.querySelectorAll('.swatch')].map((el) => el.getBoundingClientRect()),
          rulers: [...document.querySelectorAll('.ruler')].map((el) => el.getBoundingClientRect()),
        };
        return boxes;
      },
      { colorNames: colors.map(([n]) => n), dimensionNames: dimensions.map(([n]) => n) },
    );

    const shot = await page.screenshot({ fullPage: true });
    const readings = await page.evaluate(
      async ({ png, boxes }) => {
        const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${png}`)).blob());
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0);
        const pixel = (x, y) => [...ctx.getImageData(x, y, 1, 1).data];
        return {
          colors: boxes.colors.map((b) => pixel(Math.floor(b.x + b.width / 2), Math.floor(b.y + b.height / 2))),
          // Count the painted run: the ruler is black on white, so the run
          // length is the used length of the value in device pixels.
          rulers: boxes.rulers.map((b) => {
            const y = Math.floor(b.y + b.height / 2);
            let run = 0;
            for (let x = 0; x < canvas.width; x++) {
              const [r] = pixel(x, y);
              if (r > 128) break;
              run++;
            }
            return run;
          }),
        };
      },
      { png: shot.toString('base64'), boxes: sampled },
    );

    // Composite the snapshot's own value over white the way the compositor did.
    const over = ([r, g, b, a]) => [r, g, b].map((c) => Math.round(c * a + 255 * (1 - a)));

    for (const [i, [name, token]] of colors.entries()) {
      const expected = over(token.$extensions[NS].rgba);
      const actual = readings.colors[i].slice(0, 3);
      const delta = Math.max(...expected.map((c, j) => Math.abs(c - actual[j])));
      verified.push({ colorScheme, name, kind: 'color', expected, actual, delta });
    }
    for (const [i, [name, token]] of dimensions.entries()) {
      const expected = Math.round(parseFloat(token.$value));
      const actual = readings.rulers[i];
      verified.push({
        colorScheme,
        name,
        kind: 'dimension',
        expected,
        actual,
        delta: Math.abs(expected - actual),
      });
    }
    await load();
  }
}

await browser.close();

const failures = (verified ?? []).filter((v) => v.delta > (v.kind === 'color' ? TOLERANCE : 1));
if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} emitted value(s) do not match what the browser rendered\n`);
  for (const f of failures) {
    console.error(`    ${f.colorScheme} ${f.name}: snapshot ${f.expected}, screenshot ${f.actual} (Δ${f.delta})`);
  }
  process.exit(1);
}

// --- write or check ------------------------------------------------------
if (check) {
  const stale = [];
  for (const [colorScheme, snapshot] of results) {
    const path = fileFor(colorScheme);
    let onDisk;
    try {
      onDisk = JSON.parse(readFileSync(path, 'utf8'));
    } catch (error) {
      stale.push(`${path}: ${error.code === 'ENOENT' ? 'missing' : error.message}`);
      continue;
    }
    if (canonical(onDisk) !== canonical(snapshot)) {
      const before = onDisk.computed ?? {};
      const changed = Object.keys(snapshot.computed).filter(
        (k) => canonical(before[k]) !== canonical(snapshot.computed[k]),
      );
      stale.push(
        `${path}: differs from a fresh run` + (changed.length ? ` (${changed.slice(0, 8).join(', ')}…)` : ''),
      );
    }
  }
  if (stale.length > 0) {
    console.error(`\n✗ the committed snapshot is not what this Aura and these tokens produce\n`);
    for (const s of stale) console.error(`    ${s}`);
    console.error(`\nRun \`npm run snapshot\` and commit the result.\n`);
    process.exit(1);
  }
  console.log(
    `✓ ${[...results.keys()].map(fileFor).join(', ')} match a fresh run of @vaadin/aura@${auraVersion}` +
      (verified ? ` (${verified.length} values re-checked against rendered pixels)` : ''),
  );
  // Not exit(0): a page error during probing has already set exitCode.
  process.exit(process.exitCode ?? 0);
}

mkdirSync(outDir, { recursive: true });
for (const [colorScheme, snapshot] of results) {
  writeFileSync(fileFor(colorScheme), `${JSON.stringify(snapshot, null, 2)}\n`);
}

const first = results.values().next().value;
const generated = first.$extensions[NS].generated;
console.log(
  `✓ wrote ${[...results.keys()].map(fileFor).join(', ')}\n` +
    `  ${Object.keys(first.computed).length} derived properties from ${derived.length} candidates, ` +
    `${generated.unresolved.length} unresolved, engine ${engine}`,
);
if (verified && verified.length > 0) {
  const worst = verified.reduce((a, b) => (b.delta > a.delta ? b : a));
  console.log(
    `  ${verified.length} values cross-checked against rendered pixels, ` +
      `worst Δ${worst.delta} (${worst.colorScheme} ${worst.name})`,
  );
}
for (const entry of generated.unresolved) {
  console.log(`  unresolved: ${entry.cssVar} — ${entry.reason.split(' — ')[0]}`);
}
