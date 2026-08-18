#!/usr/bin/env node
/**
 * Builds ds-bundle/ — this repo's examples packaged for a claude.ai/design
 * design-system project.
 *
 * The design canvas renders plain HTML pages with a strict CSP: no bundler, no
 * npm, no external requests. This converter therefore does what the sandbox's
 * Vite dev server does, ahead of time — compile the TSX examples and the Aura
 * theme into one self-contained IIFE plus one stylesheet — and writes the file
 * layout the Design System pane reads:
 *
 *   _vendor/react.js, _vendor/react-dom.js   React as window globals
 *   _ds_bundle.js                            the component kit + preview stories
 *   styles.css                               @vaadin/aura, @import closure flattened, font inlined
 *   _preview/<Name>.js                       binds one component's stories to window.__dsPreview
 *   components/<Group>/<Name>/<Name>.html    the card (first line carries @dsCard)
 *   _ds_manifest.json                        card index, token list, themes
 *
 * Durable inputs live in .design-sync/ — config, stories, prompt files. There
 * are two kinds of card and one pipeline for both:
 *
 *   previews/<Name>.tsx   stories driving a curated components/<Name>.tsx example
 *   showcase/<Name>.tsx   stories written straight against the Vaadin API
 *
 * A config entry with `source` is the first kind and ships the example and its
 * prompt in the card folder; one without is the second, which is what lets the
 * pane index every component the design system supports without pretending each
 * one has a curated example behind it.
 *
 * Everything in ds-bundle/ is derived; never hand-edit it.
 *
 *   node scripts/build-design-bundle.mjs [outDir]
 *
 * Vite, React and the @vaadin packages are resolved from sandbox/node_modules,
 * which already pins one copy of each: two copies of React or of the Vaadin
 * elements would double-register the custom elements and break every card.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile, rm, cp, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const sandbox = path.join(root, 'sandbox');
const inputs = path.join(root, '.design-sync');
const outDir = path.resolve(process.argv[2] ?? path.join(root, 'ds-bundle'));
const scratch = path.join(sandbox, '.ds-build');

const require = createRequire(path.join(sandbox, 'package.json'));

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!existsSync(path.join(sandbox, 'node_modules', 'vite'))) {
  fail('sandbox/node_modules is missing. Run `cd sandbox && npm install` first.');
}

const config = JSON.parse(await readFile(path.join(inputs, 'config.json'), 'utf8'));
const { namespace, components, guidelines = [], kit = [] } = config;
const version = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).devDependencies[
  '@vaadin/react-components'
];

// One place that knows how deep a component page sits, so the card template and
// the CSS asset paths can't disagree.
const upToRoot = '../../../';

/**
 * NOT `_ds_bundle.js`: that path belongs to the Design app, which compiles the
 * project's own component sources into it (a `__ds_scope` wrapper) and
 * overwrites whatever was uploaded. A card loading it gets ~38 KB of generated
 * code and no `window.AuraReact`, with no error to show for it.
 */
const bundleFile = '_aura/aura-ds.js';

/**
 * Where a card's stories come from, and what else ships beside them.
 *
 * `source` present  — a curated example in components/. Its stories drive that
 *                     example, and the card carries the example and its prompt,
 *                     because the card is the visual claim that *this source*
 *                     renders *this way*.
 * `source` absent   — a showcase. Stories are written straight against the
 *                     Vaadin API, and there is no example to ship. A prompt is
 *                     optional: written where the API has a trap worth naming.
 */
const storiesDir = (component) => (component.source ? 'previews' : 'showcase');
const storiesFile = (component) => path.join(inputs, storiesDir(component), `${component.name}.tsx`);
const promptFile = (component) => path.join(inputs, 'prompts', `${component.name}.md`);
const hasPrompt = (component) => existsSync(promptFile(component));

const vaadinDir = path.join(sandbox, 'node_modules', '@vaadin');
const reactDir = path.join(sandbox, 'node_modules', 'react');
const reactDomDir = path.join(sandbox, 'node_modules', 'react-dom');

/** Shared Vite config: one React, one @vaadin, production mode. */
function baseConfig(react) {
  return {
    root: sandbox,
    configFile: false,
    logLevel: 'error',
    plugins: [react()],
    define: { 'process.env.NODE_ENV': '"production"' },
    resolve: {
      dedupe: ['react', 'react-dom', 'lit', '@lit/reactive-element', 'lit-html'],
      alias: { react: reactDir, 'react-dom': reactDomDir, '@vaadin': vaadinDir },
    },
  };
}

async function main() {
  const { build } = require('vite');
  const react = require('@vitejs/plugin-react').default;

  await rm(outDir, { recursive: true, force: true });
  await rm(scratch, { recursive: true, force: true });
  await mkdir(scratch, { recursive: true });
  await mkdir(outDir, { recursive: true });

  // 1. React as globals. react-dom is built with react EXTERNAL so both halves
  //    share one instance — a second copy makes every hook call throw.
  await writeFile(
    path.join(scratch, 'vendor-react.js'),
    "import * as React from 'react';\nwindow.React = React;\n",
  );
  await writeFile(
    path.join(scratch, 'vendor-react-dom.js'),
    [
      "import * as ReactDOM from 'react-dom';",
      "import * as ReactDOMClient from 'react-dom/client';",
      // createPortal lives in react-dom, createRoot in react-dom/client, and the
      // Vaadin wrappers use both.
      'window.ReactDOM = Object.assign({}, ReactDOM, ReactDOMClient);',
      '',
    ].join('\n'),
  );

  await buildLib(build, react, {
    entry: path.join(scratch, 'vendor-react.js'),
    fileName: '_vendor/react.js',
    name: 'VendorReact',
  });
  await buildLib(build, react, {
    entry: path.join(scratch, 'vendor-react-dom.js'),
    fileName: '_vendor/react-dom.js',
    name: 'VendorReactDOM',
    external: { react: 'React' },
  });

  // 2. The kit + the stories, in one bundle so the Vaadin elements register once.
  await writeFile(path.join(scratch, 'bundle.tsx'), bundleEntry(components));
  await buildLib(build, react, {
    entry: path.join(scratch, 'bundle.tsx'),
    fileName: bundleFile,
    name: namespace,
    external: { react: 'React', 'react-dom': 'ReactDOM', 'react-dom/client': 'ReactDOM' },
    css: true,
  });

  // 3. Per-component files.
  await mkdir(path.join(outDir, '_preview'), { recursive: true });
  for (const component of components) {
    const dir = path.join(outDir, 'components', component.group, component.name);
    await mkdir(dir, { recursive: true });

    await writeFile(
      path.join(outDir, '_preview', `${component.name}.js`),
      `window.__dsPreview = (window.${namespace} && window.${namespace}.__stories && window.${namespace}.__stories.${component.name}) || {};\n`,
    );
    await writeFile(path.join(dir, `${component.name}.html`), card(component, namespace));
    await cp(storiesFile(component), path.join(dir, `${component.name}.stories.tsx`));
    if (component.source) {
      await cp(path.join(root, component.source), path.join(dir, `${component.name}.tsx`));
    }
    if (hasPrompt(component)) {
      await cp(promptFile(component), path.join(dir, `${component.name}.prompt.md`));
    }
  }

  // 4. Docs, tokens, guidelines.
  await cp(path.join(inputs, 'ds-readme.md'), path.join(outDir, 'README.md'));
  await cp(path.join(root, 'DESIGN.md'), path.join(outDir, 'DESIGN.md'));
  await mkdir(path.join(outDir, 'tokens'), { recursive: true });
  await cp(path.join(root, 'tokens', 'tokens.json'), path.join(outDir, 'tokens', 'tokens.json'));
  await mkdir(path.join(outDir, 'guidelines'), { recursive: true });
  await writeFile(path.join(outDir, 'guidelines', 'tokens.html'), tokensCard());

  // 5. Manifest.
  await writeFile(
    path.join(outDir, '_ds_manifest.json'),
    `${JSON.stringify(await manifest(components, guidelines, namespace, version), null, 2)}\n`,
  );

  await rm(scratch, { recursive: true, force: true });
  await selfCheck(components, namespace);
}

/** One Vite lib build, emitted straight into ds-bundle/ under a fixed name. */
async function buildLib(build, react, { entry, fileName, name, external = {}, css = false }) {
  const externals = Object.keys(external);
  await mkdir(path.join(outDir, path.dirname(fileName)), { recursive: true });

  await build({
    ...baseConfig(react),
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      // Inline the Instrument Sans woff2 into styles.css: one self-contained
      // stylesheet beats an asset path that has to survive the upload.
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      minify: 'esbuild',
      lib: { entry, formats: ['iife'], name, fileName: () => fileName },
      rollupOptions: {
        external: externals,
        output: {
          globals: external,
          inlineDynamicImports: true,
          assetFileNames: (asset) =>
            asset.names?.[0]?.endsWith('.css') || asset.name?.endsWith('.css')
              ? 'styles.css'
              : 'assets/[name][extname]',
        },
      },
    },
  });

  if (!css && existsSync(path.join(outDir, 'styles.css'))) {
    // Only the main bundle is expected to emit CSS; a stray one means a vendor
    // entry pulled in a stylesheet and the theme would be overwritten.
    const stat = statSync(path.join(outDir, 'styles.css'));
    if (stat.size < 1000) fail(`unexpected styles.css emitted by ${fileName}`);
  }
}

/**
 * The kit is an explicit list — `config.kit` — and not
 * `export * from '@vaadin/react-components'`. A barrel is unreviewable: nothing
 * in the diff says what the design system claims to support, and a Vaadin
 * release silently changes the answer. scripts/check-showcase.mjs holds the list
 * to the installed package in the other direction, so a component that appears
 * or disappears is a failed build rather than a card nobody notices is missing.
 *
 * Export name and module name are the same for every component in the package,
 * which is what lets one name stand for both.
 */
const KIT = kit;

function bundleEntry(components) {
  const imports = [
    "// The theme and the iconsets, exactly as an application entry point loads them.",
    "import '@vaadin/aura';",
    "import '@vaadin/icons';",
    '',
    ...KIT.map((name) => `import { ${name} } from '@vaadin/react-components/${name}.js';`),
    '',
    ...components.map(
      (c) => `import * as ${c.name}Stories from '../../.design-sync/${storiesDir(c)}/${c.name}';`,
    ),
  ];

  return [
    ...imports,
    '',
    `window.${config.namespace} = {`,
    ...KIT.map((name) => `  ${name},`),
    '  __stories: {',
    ...components.map((c) => `    ${c.name}: ${c.name}Stories,`),
    '  },',
    '};',
    '',
  ].join('\n');
}

/**
 * The card page. Every PascalCase export of the component's story module gets a
 * labelled cell, so adding a story to .design-sync/previews/ is all it takes to
 * make it show up. `?story=Name` renders one on its own, which is what the pane
 * uses for a focused view.
 */
function card(component, ns) {
  const mode = component.mode ?? 'grid';
  const primary = component.primary ?? '';
  // The pane sizes each card iframe to its content height, and a dialog's
  // overlay is fixed-positioned — it contributes nothing, so the card collapses
  // and clips the very thing it exists to show.
  const minHeight = component.minHeight ? `;min-height:${component.minHeight}px` : '';
  return `<!-- @dsCard group="${component.group}" -->
<!doctype html>
<html><head><meta charset="utf-8">
  <link rel="stylesheet" href="${upToRoot}styles.css">
  <style>
    body{margin:0;padding:24px;background:var(--vaadin-background-color,#fff);color:var(--vaadin-text-color)${minHeight}}
    .ds-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;align-items:start}
    .ds-grid.ds-col{grid-template-columns:1fr}
    .ds-cell{border:1px solid var(--vaadin-border-color-secondary);border-radius:var(--vaadin-radius-m);padding:var(--vaadin-padding-m);min-width:0;overflow:hidden}
    .ds-cell>h4{margin:0 0 var(--vaadin-gap-s);font-size:var(--aura-font-size-xs);line-height:var(--aura-line-height-xs);font-weight:var(--aura-font-weight-semibold);color:var(--vaadin-text-color-secondary);text-transform:uppercase;letter-spacing:.04em}
  </style>
</head><body>
  <div class="ds-grid" id="g"></div>
  <script>
    // Installed before anything else so a throw inside a bundle is reportable:
    // the card is the only place a hosted iframe can show it.
    window.__dsErrors = [];
    window.addEventListener('error', function (event) {
      window.__dsErrors.push((event.message || 'error') + ' @ ' +
        String(event.filename || '').split('/').pop() + ':' + event.lineno);
    });
  </script>
  <script src="${upToRoot}_vendor/react.js" onerror="(window.__dsFailed=window.__dsFailed||[]).push('_vendor/react.js')"></script>
  <script src="${upToRoot}_vendor/react-dom.js" onerror="(window.__dsFailed=window.__dsFailed||[]).push('_vendor/react-dom.js')"></script>
  <script src="${upToRoot}${bundleFile}" onerror="(window.__dsFailed=window.__dsFailed||[]).push('${bundleFile}')"></script>
  <script src="${upToRoot}_preview/${component.name}.js" onerror="(window.__dsFailed=window.__dsFailed||[]).push('_preview/${component.name}.js')"></script>
  <script>
    var h = React.createElement, g = document.getElementById('g');
    var stories = [];
    for (var key in (window.__dsPreview || {})) {
      if (typeof window.__dsPreview[key] === 'function' && /^[A-Z]/.test(key)) stories.push(key);
    }
    // Declared order beats alphabetical: the bundler sorts the module's exports,
    // and the first cell is the one that teaches the pattern.
    var declared = (window.__dsPreview && window.__dsPreview.__order) || [];
    stories.sort(function (a, b) {
      var ai = declared.indexOf(a), bi = declared.indexOf(b);
      if (ai < 0 && bi < 0) return a < b ? -1 : 1;
      if (ai < 0) return 1;
      if (bi < 0) return -1;
      return ai - bi;
    });
    window.__dsCells = stories.slice();
    window.__dsMode = ${JSON.stringify(mode)};
    var requested = null;
    try { requested = new URLSearchParams(location.search).get('story'); } catch (e) {}
    var PRIMARY = ${JSON.stringify(primary)};
    if (window.__dsMode === 'column') g.className += ' ds-col';
    function mount(id, key) {
      try { ReactDOM.createRoot(document.getElementById(id)).render(h(window.__dsPreview[key])); }
      catch (e) { document.getElementById(id).textContent = '⚠ ' + (e && e.message || e); }
    }
    var pick = null;
    if (requested) {
      for (var j = 0; j < stories.length; j++) {
        if (stories[j].toLowerCase() === requested.toLowerCase()) { pick = stories[j]; break; }
      }
      if (!pick) g.textContent = '⚠ no story named ' + requested;
    } else if (window.__dsMode === 'single' && stories.length) {
      pick = stories.indexOf(PRIMARY) >= 0 ? PRIMARY : stories[0];
    }
    if (pick) {
      var solo = document.createElement('div');
      solo.id = 'r0';
      g.parentNode.replaceChild(solo, g);
      mount('r0', pick);
    } else if (stories.length) {
      for (var i = 0; i < stories.length; i++) {
        var cell = document.createElement('section');
        cell.className = 'ds-cell';
        cell.innerHTML = '<h4>' + stories[i] + '</h4><div id="r' + i + '"></div>';
        g.appendChild(cell);
        mount('r' + i, stories[i]);
      }
    } else if (!requested) {
      // A card that renders nothing must say why: which script failed to load,
      // and which globals actually arrived.
      g.textContent = '⚠ no stories — errors: [' + ((window.__dsErrors || []).join(' // ') || 'none') +
        '] failed: [' + ((window.__dsFailed || []).join(', ') || 'none') +
        '] React:' + typeof window.React + ' ReactDOM:' + typeof window.ReactDOM +
        ' ${config.namespace}:' + typeof window.${config.namespace} +
        ' stories:' + Object.prototype.toString.call(window.__dsPreview) +
        ' keys:[' + Object.keys(window.__dsPreview || {}).join(',') + ']';
      // Whether the bundle the host served is the bundle that was uploaded.
      fetch('${upToRoot}${bundleFile}').then(function (response) {
        return response.text().then(function (text) {
          g.textContent += ' | served ' + response.status + ' ' +
            (response.headers.get('content-type') || '?') + ' bytes:' + text.length +
            ' tail:' + JSON.stringify(text.slice(-48));
        });
      }).catch(function (error) { g.textContent += ' | fetch failed: ' + error.message; });
    }
  </script>
</body></html>
`;
}

/**
 * Aura derives most of its surface at runtime, so a hand-written swatch sheet
 * would be a transcription that can drift. This card reads the live theme.
 *
 * It has to resolve through a probe element rather than read the declarations:
 * `getPropertyValue('--vaadin-text-color')` hands back Aura's derivation —
 * a page of nested light-dark()/oklch()/calc() — because custom properties
 * resolve lazily. Assigning one to a real property and reading *that* back is
 * what forces the computation.
 */
function tokensCard() {
  return `<!-- @dsCard group="Foundations" -->
<!doctype html>
<html><head><meta charset="utf-8">
  <link rel="stylesheet" href="../styles.css">
  <style>
    body{margin:0;padding:var(--vaadin-padding-l);background:var(--vaadin-background-color,#fff);color:var(--vaadin-text-color)}
    h2{font-size:var(--aura-font-size-l);line-height:var(--aura-line-height-l);margin:var(--vaadin-gap-l) 0 var(--vaadin-gap-xs)}
    h2:first-child{margin-top:0}
    p.note{color:var(--vaadin-text-color-secondary);font-size:var(--aura-font-size-s);line-height:var(--aura-line-height-s);max-width:70ch;margin:0 0 var(--vaadin-gap-m)}
    .row{display:flex;flex-wrap:wrap;gap:var(--vaadin-gap-s)}
    .swatch{width:150px}
    .chip{height:44px;border-radius:var(--vaadin-radius-s);border:1px solid var(--vaadin-border-color-secondary)}
    code{display:block;margin-top:4px;font-size:var(--aura-font-size-xs);line-height:var(--aura-line-height-xs);overflow-wrap:anywhere}
    code b{display:block;font-weight:var(--aura-font-weight-medium);color:var(--vaadin-text-color)}
    code span{color:var(--vaadin-text-color-secondary)}
    .bar{background:var(--aura-accent-color);height:12px;border-radius:var(--vaadin-radius-s)}
    table{border-collapse:collapse}
    td{padding:var(--vaadin-padding-xs) var(--vaadin-padding-s) var(--vaadin-padding-xs) 0;vertical-align:middle}
  </style>
</head><body>
  <h2>Colour</h2>
  <p class="note">Aura is a computed theme: of its 91 root custom properties only ~32 are authorable
  inputs, and the rest — every value below — are derived at runtime from the background colour, the
  accent and the contrast level. Read them; never transcribe them. To change one, move the input.</p>
  <div class="row" id="colors"></div>

  <h2>Type</h2>
  <p class="note">Always pair a size with the line height of the same step.</p>
  <div id="type"></div>

  <h2>Spacing</h2>
  <p class="note">Derived from <code style="display:inline">--aura-base-size</code>, which Aura raises under <code style="display:inline">@media (pointer: coarse)</code>.</p>
  <div id="space"></div>

  <h2>Radius &amp; elevation</h2>
  <div class="row" id="shape"></div>

  <script>
    // The probe must sit in the document to inherit the :root custom properties.
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:0;height:0';
    document.body.appendChild(probe);

    function resolve(property, name) {
      probe.style[property] = 'var(' + name + ')';
      var value = getComputedStyle(probe)[property];
      probe.style[property] = '';
      return value || '—';
    }

    function swatch(name, background, value) {
      return '<div class="swatch"><div class="chip" style="background:' + background + '"></div>' +
        '<code><b>' + name + '</b><span>' + value + '</span></code></div>';
    }

    var COLORS = ['--vaadin-background-color','--aura-surface-color','--vaadin-background-container',
      '--vaadin-background-container-strong','--vaadin-text-color','--vaadin-text-color-secondary',
      '--vaadin-text-color-disabled','--vaadin-border-color','--vaadin-border-color-secondary',
      '--aura-accent-color','--aura-accent-text-color','--aura-accent-contrast-color','--aura-accent-surface',
      '--aura-accent-border-color','--vaadin-focus-ring-color','--aura-red','--aura-orange','--aura-yellow',
      '--aura-green','--aura-blue','--aura-purple'];
    document.getElementById('colors').innerHTML = COLORS.map(function (name) {
      return swatch(name, 'var(' + name + ')', resolve('color', name));
    }).join('');

    var STEPS = ['xs','s','m','l','xl'];
    document.getElementById('type').innerHTML = '<table>' + STEPS.map(function (step) {
      return '<tr><td style="font-size:var(--aura-font-size-' + step + ');line-height:var(--aura-line-height-' + step + ')">' +
        'Aura ' + step + '</td><td><code><b>--aura-font-size-' + step + '</b><span>' +
        resolve('fontSize', '--aura-font-size-' + step) + ' / line-height ' +
        resolve('lineHeight', '--aura-line-height-' + step) + '</span></code></td></tr>';
    }).join('') + '</table>';

    document.getElementById('space').innerHTML = '<table>' + [].concat(
      STEPS.map(function (step) { return ['--vaadin-gap-' + step, 'gap']; }),
      STEPS.map(function (step) { return ['--vaadin-padding-' + step, 'padding']; })
    ).map(function (pair) {
      return '<tr><td style="width:200px"><div class="bar" style="width:var(' + pair[0] + ')"></div></td>' +
        '<td><code><b>' + pair[0] + '</b><span>' + resolve('width', pair[0]) + '</span></code></td></tr>';
    }).join('') + '</table>';

    document.getElementById('shape').innerHTML = ['s','m','l'].map(function (step) {
      var name = '--vaadin-radius-' + step;
      return '<div class="swatch"><div style="height:52px;background:var(--aura-surface-color);' +
        'border:1px solid var(--vaadin-border-color);border-radius:var(' + name + ')"></div>' +
        '<code><b>' + name + '</b><span>' + resolve('width', name) + '</span></code></div>';
    }).join('') + ['xs','s','m'].map(function (step) {
      return '<div class="swatch"><div style="height:52px;background:var(--aura-surface-color);' +
        'border-radius:var(--vaadin-radius-s);box-shadow:var(--aura-shadow-' + step + ')"></div>' +
        '<code><b>--aura-shadow-' + step + '</b></code></div>';
    }).join('');
  </script>
</body></html>
`;
}

const KIND = { color: 'color', fontFamily: 'font', fontWeight: 'font', number: 'other' };

/** Flatten the DTCG file to the manifest's token list — semantic layer only. */
function flattenTokens(node, trail = []) {
  const out = [];
  const marker = node?.$extensions?.['com.vaadin.aura'];
  if (node && typeof node === 'object' && '$value' in node && marker?.layer === 'semantic') {
    const value = Array.isArray(node.$value) ? node.$value.join(', ') : String(node.$value);
    out.push({
      name: marker.cssVar,
      value,
      kind: KIND[node.$type] ?? 'other',
      definedIn: 'tokens/tokens.json',
      ...(node.$description ? { annotation: node.$description } : {}),
    });
  }
  for (const [key, child] of Object.entries(node ?? {})) {
    if (key.startsWith('$') || typeof child !== 'object' || child === null) continue;
    out.push(...flattenTokens({ ...child, $type: child.$type ?? node.$type }, [...trail, key]));
  }
  return out;
}

async function manifest(components, guidelines, ns, ver) {
  const tokens = JSON.parse(await readFile(path.join(root, 'tokens', 'tokens.json'), 'utf8'));
  return {
    namespace: ns,
    version: ver,
    // The source the pane shows for a component: its curated example where there
    // is one, otherwise the stories, which are the only source that card has.
    components: components.map((c) => ({
      name: c.name,
      sourcePath: `components/${c.group}/${c.name}/${c.name}.${c.source ? 'tsx' : 'stories.tsx'}`,
    })),
    startingPoints: [],
    cards: [
      ...components.map((c) => ({
        path: `components/${c.group}/${c.name}/${c.name}.html`,
        group: c.group,
        name: c.name,
        ...(c.subtitle ? { subtitle: c.subtitle } : {}),
        ...(c.viewport ? { viewport: c.viewport } : {}),
      })),
      ...guidelines.map((g) => ({ ...g })),
    ],
    templates: [],
    hasThumbnailHtml: false,
    globalCssPaths: ['styles.css'],
    tokens: flattenTokens(tokens),
    themes: [{ selector: '[theme~="dark"]', label: 'Dark' }],
    fonts: [],
    brandFonts: [
      { family: 'Instrument Sans', status: 'ok', tokens: ['--aura-font-family'], path: 'styles.css' },
    ],
    source: 'scripts/build-design-bundle.mjs',
  };
}

/**
 * What can be checked without a browser: the bundle is self-contained, every
 * component's stories are reachable from the global, and nothing is empty.
 */
async function selfCheck(components, ns) {
  const problems = [];
  const size = (p) => (existsSync(p) ? statSync(p).size : 0);

  const bundle = path.join(outDir, bundleFile);
  const styles = path.join(outDir, 'styles.css');
  const bundleSource = await readFile(bundle, 'utf8');
  const stylesSource = await readFile(styles, 'utf8');

  if (size(bundle) < 200_000) problems.push(`${bundleFile} is only ${size(bundle)} B — suspiciously small`);
  if (size(styles) < 50_000) problems.push(`styles.css is only ${size(styles)} B — the Aura @import closure is missing`);
  if (size(path.join(outDir, '_vendor/react.js')) < 5_000) problems.push('_vendor/react.js is too small');
  if (size(path.join(outDir, '_vendor/react-dom.js')) < 100_000) problems.push('_vendor/react-dom.js is too small');

  for (const source of [bundleSource, stylesSource]) {
    // data: URIs are fine; a network origin is not — the canvas CSP blocks it
    // and the card would render unstyled or blank.
    const external = source.match(/(?:src|href)\s*[=:]\s*["']https?:\/\/[^"']+/g) ?? [];
    const imports = source.match(/@import\s+(?:url\()?["']?https?:\/\/[^"')]+/g) ?? [];
    for (const hit of [...external, ...imports]) problems.push(`external reference in output: ${hit.slice(0, 80)}`);
  }

  if (!/@font-face/.test(stylesSource)) problems.push('styles.css has no @font-face — Instrument Sans did not make it in');
  if (/url\(["']?\.?\/?assets\//.test(stylesSource)) problems.push('styles.css references an emitted asset instead of inlining it');
  if (!bundleSource.includes('__stories')) problems.push(`${bundleFile} does not expose __stories`);

  for (const component of components) {
    const dir = path.join(outDir, 'components', component.group, component.name);
    const expected = [`${component.name}.html`, `${component.name}.stories.tsx`];
    if (component.source) expected.push(`${component.name}.tsx`);
    if (hasPrompt(component)) expected.push(`${component.name}.prompt.md`);
    for (const file of expected) {
      if (size(path.join(dir, file)) === 0) problems.push(`missing or empty: ${path.relative(outDir, path.join(dir, file))}`);
    }
    const cardSource = await readFile(path.join(dir, `${component.name}.html`), 'utf8');
    if (!cardSource.startsWith(`<!-- @dsCard group="${component.group}" -->`)) {
      problems.push(`${component.name}.html is missing its @dsCard first line`);
    }
    // The stories module is name-mangled in the bundle, so check the story
    // names survived rather than the identifier.
    const stories = (await readFile(storiesFile(component), 'utf8'))
      .match(/export const (\w+)/g)
      ?.map((m) => m.replace('export const ', '')) ?? [];
    if (stories.length === 0) problems.push(`${component.name} has no exported stories`);
    for (const story of stories) {
      if (!bundleSource.includes(story)) problems.push(`story ${component.name}.${story} is not in the bundle`);
    }
  }

  const files = [];
  for (const entry of await readdir(outDir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) files.push(path.relative(outDir, path.join(entry.parentPath ?? entry.path, entry.name)));
  }

  console.log(`\n${files.length} files in ${path.relative(root, outDir)}/`);
  console.log(`  ${bundleFile}  ${(size(bundle) / 1024).toFixed(0)} KB`);
  console.log(`  styles.css     ${(size(styles) / 1024).toFixed(0)} KB`);
  console.log(`  cards          ${components.length} components + ${(config.guidelines ?? []).length} guidelines`);

  if (problems.length) {
    console.error('\nSelf-check failed:');
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    process.exit(1);
  }
  console.log(`\n✓ self-check passed (window.${ns} — kit of ${KIT.length}, stories for ${components.length})`);
}

await main();
