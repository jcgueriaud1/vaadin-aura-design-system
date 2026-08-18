#!/usr/bin/env node
/**
 * The publish workflow going green proves the tarball was accepted. It does not
 * prove a consumer can use it: `files` can be wrong, the registry can serve
 * something other than what was tagged, and — the one that actually decides
 * whether Phase 2 is possible — an overlay's Style Dictionary build has to
 * resolve `{aura.*}` references across a package boundary, out of node_modules,
 * without losing the `$extensions` markers the snapshot generator reads. None of
 * that is visible from inside this repo.
 *
 * So this is the acceptance test written from the outside: it installs the
 * package into an empty directory that is not this repo, then behaves like an
 * overlay. Eight ways to fail:
 *
 *   REGISTRY    npm cannot install the spec at all (auth, scope, visibility)
 *   PROVENANCE  it resolved to something other than GitHub Packages
 *   CONTENTS    the installed tree is not the file list the release packs
 *   CONTENT     same names, different bytes — the registry is serving other code
 *   REFERENCES  a base reference does not resolve from inside node_modules
 *   OVERRIDE    re-pointing a semantic token does not take
 *   EXTENSIONS  the cssVar markers do not survive the resolve, so the snapshot
 *               generator would not know which Aura property a token sets
 *   CONTROL     the reference check cannot fail, so the run proved nothing
 *
 * What "the release packs" means is deliberate: in registry mode the comparison
 * is against a pack of the TAG the installed version came from, not HEAD, or
 * every commit after a release would look like drift. In tarball mode there is no
 * registry and no tag, so CONTENTS and CONTENT compare a pack against itself and
 * exist only to keep the two paths identical; the overlay resolve is what bites
 * there, kept non-vacuous by a negative control.
 *
 * Two modes, because the interesting half needs no credentials:
 *
 *   check-consumer.mjs                    pack this commit, install the tarball (offline, no token)
 *   check-consumer.mjs --registry         install this version from GitHub Packages
 *   check-consumer.mjs --registry @scope/pkg@1.2.3
 *
 * Registry mode needs NODE_AUTH_TOKEN (or GITHUB_TOKEN) carrying read:packages.
 * A repo-scoped token is not enough — the registry answers 403, and an
 * unauthenticated request answers 401 even though the package is public. Inside
 * Actions, `permissions: packages: read` gives the built-in GITHUB_TOKEN exactly
 * this, which is why consumer.yml exists and why nobody needs a personal token.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REGISTRY = 'https://npm.pkg.github.com';
const repo = resolve(dirname(new URL(import.meta.url).pathname), '..');
const pkg = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));

const args = process.argv.slice(2);
const registryMode = args.includes('--registry');
const keep = args.includes('--keep');
const explicitSpec = args.find((a) => !a.startsWith('--'));
const spec = explicitSpec ?? `${pkg.name}@${pkg.version}`;
const scope = pkg.name.split('/')[0];

const problems = [];
const report = (message) => problems.push(message);
const run = (cmd, cmdArgs, cwd, env) =>
  execFileSync(cmd, cmdArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } });

const workspace = mkdtempSync(join(tmpdir(), 'aura-consumer-'));
const consumer = join(workspace, 'consumer');
mkdirSync(consumer);

/** Pack a source tree and unpack the result: the file list plus the bytes. */
const packFrom = (source, label) => {
  const into = join(workspace, `pack-${label}`);
  const unpacked = join(workspace, `tree-${label}`);
  mkdirSync(into);
  mkdirSync(unpacked);
  const [result] = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', into], source));
  const tarball = join(into, result.filename);
  run('tar', ['xzf', tarball, '-C', unpacked], workspace);
  return { files: result.files.map((f) => f.path).sort(), tarball, tree: join(unpacked, 'package') };
};

try {
  /* An empty project that is not this repo. In registry mode the only thing it is
     given is an .npmrc and a token — a Phase 2 overlay's starting point exactly. */
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 2));

  const env = {};
  let installSpec = spec;
  let head = null;
  if (registryMode) {
    const token = process.env.NODE_AUTH_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('✗ registry mode needs NODE_AUTH_TOKEN or GITHUB_TOKEN carrying read:packages');
      process.exit(1);
    }
    writeFileSync(
      join(consumer, '.npmrc'),
      `${scope}:registry=${REGISTRY}\n${REGISTRY.replace('https:', '')}/:_authToken=\${NODE_AUTH_TOKEN}\n`,
    );
    env.NODE_AUTH_TOKEN = token;
  } else {
    head = packFrom(repo, 'head');
    installSpec = head.tarball;
  }

  const styleDictionary = `style-dictionary@${pkg.devDependencies['style-dictionary']}`;
  try {
    run('npm', ['install', '--no-audit', '--fund=false', '--prefer-offline', installSpec, styleDictionary], consumer, env);
  } catch (error) {
    const detail = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n').slice(-6).join('\n  ');
    console.error(`✗ REGISTRY: npm could not install ${installSpec}\n  ${detail}`);
    process.exit(1);
  }

  const installed = join(consumer, 'node_modules', pkg.name);
  const lock = JSON.parse(readFileSync(join(consumer, 'package-lock.json'), 'utf8'));
  const entry = lock.packages[`node_modules/${pkg.name}`];

  /* PROVENANCE — that it came from GitHub Packages, not a cache or a path. */
  if (registryMode && !entry?.resolved?.startsWith(REGISTRY)) {
    report(`PROVENANCE: resolved from ${entry?.resolved ?? 'nowhere'}, expected ${REGISTRY}`);
  }
  if (!explicitSpec && entry?.version !== pkg.version) {
    report(`PROVENANCE: installed ${entry?.version}, this commit is ${pkg.version}`);
  }

  /* The reference to judge the installed tree against: the tag the installed
     version came from, so that later commits are not mistaken for drift. Falls
     back to HEAD, and says so, when the tag is not in this clone — a shallow
     checkout has no tags. */
  let reference = head;
  let referenceLabel = 'this commit';
  if (registryMode) {
    const tag = `v${entry.version}`;
    let archive = null;
    try {
      run('git', ['rev-parse', '--verify', `${tag}^{commit}`], repo);
      archive = join(workspace, 'tagged');
      mkdirSync(archive);
      execFileSync('bash', ['-c', `git archive ${tag} | tar x -C ${JSON.stringify(archive)}`], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      archive = null;
    }
    if (archive) {
      reference = packFrom(archive, 'tagged');
      referenceLabel = tag;
    } else {
      reference = packFrom(repo, 'head');
      referenceLabel = 'this commit (tag not in this clone)';
    }
  }

  /* CONTENTS — the file list, both directions. */
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [relative(installed, full)];
    });
  const actual = walk(installed).sort();
  for (const file of reference.files) if (!actual.includes(file)) report(`CONTENTS: ${referenceLabel} packs ${file}, the installed tree has no such file`);
  for (const file of actual) if (!reference.files.includes(file)) report(`CONTENTS: ${file} was installed but ${referenceLabel} does not pack it`);

  /* The three the release is supposed to be for, stated as themselves rather than
     inferred from the list above — this is what a consumer came to install. */
  for (const required of ['tokens/tokens.json', 'components/Button.tsx', 'DESIGN.md']) {
    if (!actual.includes(required)) report(`CONTENTS: ${required} is not in the installed tree`);
  }

  /* CONTENT — same names is not the same code. package.json is compared parsed
     and without gitHead, which npm stamps into the published tarball. */
  const digest = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
  for (const file of reference.files.filter((f) => actual.includes(f))) {
    const mine = join(reference.tree, file);
    const theirs = join(installed, file);
    if (file === 'package.json') {
      const strip = (path) => {
        const { gitHead, ...rest } = JSON.parse(readFileSync(path, 'utf8'));
        return JSON.stringify(rest);
      };
      if (strip(mine) !== strip(theirs)) report(`CONTENT: the installed package.json differs from ${referenceLabel}'s`);
    } else if (digest(mine) !== digest(theirs)) {
      report(`CONTENT: ${file} differs from ${referenceLabel}'s`);
    }
  }

  /* Now stop being a test and be an overlay: re-point the accent at a brand
     colour and resolve the whole set with the base tokens read out of
     node_modules. This is the Phase 2 flow, minus the browser. */
  writeFileSync(join(consumer, 'brand.json'), JSON.stringify({
    brand: { $type: 'color', primary: { $value: 'oklch(0.55 0.22 300)', $extensions: { 'com.vaadin.aura': { layer: 'primitive' } } } },
    aura: {
      accent: {
        $type: 'color',
        light: { $value: '{brand.primary}', $extensions: { 'com.vaadin.aura': { layer: 'semantic', cssVar: '--aura-accent-color-light' } } },
        dark: { $value: '{brand.primary}', $extensions: { 'com.vaadin.aura': { layer: 'semantic', cssVar: '--aura-accent-color-dark' } } },
      },
    },
  }, null, 2));

  /* The consumer's own copy of Style Dictionary, resolved from the consumer's
     node_modules rather than this repo's — the version an overlay would get. */
  const consumerRequire = createRequire(pathToFileURL(join(consumer, 'package.json')).href);
  const { default: StyleDictionary } = await import(pathToFileURL(consumerRequire.resolve('style-dictionary')).href);

  /* Absolute paths throughout: Style Dictionary resolves `source` and `buildPath`
     against process.cwd(), which is this repo, not the consumer — relative paths
     here silently build an EMPTY dictionary instead of failing. */
  const build = async (sources, out) => {
    const sd = new StyleDictionary({
      source: sources,
      platforms: {
        json: {
          transformGroup: 'js',
          buildPath: `${join(consumer, out)}/`,
          files: [{ destination: 'tokens.resolved.json', format: 'json' }],
        },
      },
      log: { verbosity: 'silent', warnings: 'disabled' },
    });
    await sd.buildAllPlatforms();
    return JSON.parse(readFileSync(join(consumer, out, 'tokens.resolved.json'), 'utf8'));
  };

  const baseTokens = join(installed, 'tokens', 'tokens.json');
  const resolved = await build([baseTokens, join(consumer, 'brand.json')], 'out');
  const at = (path) => path.split('.').reduce((node, key) => node?.[key], resolved);

  /* REFERENCES — nothing anywhere still looks like {a.b.c}. */
  const unresolved = [];
  (function walkTokens(node, path) {
    if (!node || typeof node !== 'object') return;
    if ('$value' in node) {
      if (/\{[a-zA-Z][\w.-]*\}/.test(JSON.stringify(node.$value))) unresolved.push(path);
      return;
    }
    for (const key of Object.keys(node).filter((k) => !k.startsWith('$'))) walkTokens(node[key], path ? `${path}.${key}` : key);
  })(resolved, '');
  for (const path of unresolved) report(`REFERENCES: ${path} still holds an unresolved reference`);

  /* A base→base reference had to be followed across the package boundary. */
  if (at('aura.color.red')?.$value !== 'oklch(0.59 0.2 25)') {
    report(`REFERENCES: aura.color.red resolved to ${JSON.stringify(at('aura.color.red')?.$value)}, expected the base primitive`);
  }

  /* OVERRIDE — the overlay's value won, in both schemes. */
  for (const scheme of ['light', 'dark']) {
    if (at(`aura.accent.${scheme}`)?.$value !== 'oklch(0.55 0.22 300)') {
      report(`OVERRIDE: aura.accent.${scheme} is ${JSON.stringify(at(`aura.accent.${scheme}`)?.$value)}, not the overlay's brand colour`);
    }
  }

  /* EXTENSIONS — the marker the snapshot generator reads, on a token that came
     from the base and on one the overlay replaced. */
  for (const [path, cssVar] of [['aura.color.red', '--aura-red'], ['aura.accent.light', '--aura-accent-color-light']]) {
    const marker = at(path)?.$extensions?.['com.vaadin.aura'];
    if (marker?.cssVar !== cssVar) report(`EXTENSIONS: ${path} lost its cssVar through the resolve (got ${JSON.stringify(marker?.cssVar)})`);
    if (marker?.layer !== 'semantic') report(`EXTENSIONS: ${path} lost its layer marker through the resolve`);
  }

  const count = (function tally(node) {
    if (!node || typeof node !== 'object') return 0;
    if ('$value' in node) return 1;
    return Object.keys(node).filter((k) => !k.startsWith('$')).reduce((sum, k) => sum + tally(node[k]), 0);
  })(resolved);
  if (count < 30) report(`REFERENCES: the resolve produced only ${count} tokens — the base source was not read`);

  /* NEGATIVE CONTROL — the same resolve, one reference deliberately pointed at a
     token that does not exist. If this comes back clean, the REFERENCES check
     above proved nothing and the whole run is vacuous. */
  writeFileSync(join(consumer, 'broken.json'), JSON.stringify({
    aura: {
      accent: {
        $type: 'color',
        light: { $value: '{brand.nonexistent}', $extensions: { 'com.vaadin.aura': { layer: 'semantic', cssVar: '--aura-accent-color-light' } } },
      },
    },
  }, null, 2));
  let controlFired = false;
  try {
    const broken = await build([baseTokens, join(consumer, 'broken.json')], 'control');
    controlFired = /\{brand\.nonexistent\}/.test(JSON.stringify(broken.aura?.accent?.light?.$value ?? ''));
  } catch {
    controlFired = true; // Style Dictionary refusing to build is the strongest form of noticing
  }
  if (!controlFired) report('CONTROL: a reference to a nonexistent token resolved cleanly — the REFERENCES check cannot fail');

  if (problems.length) {
    console.error(`✗ ${spec} fails as a consumer dependency:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    process.exit(1);
  }

  const source = registryMode
    ? `${REGISTRY} (${entry.integrity.slice(0, 23)}…), byte-identical to ${referenceLabel}`
    : 'the tarball this commit packs';
  console.log(
    `✓ ${pkg.name}@${entry.version} installs from ${source} into a clean project: ` +
      `${actual.length} files, and an overlay resolves ${count} tokens against them ` +
      `(accent re-pointed, every reference resolved, cssVar markers intact, negative control fired)`,
  );
} finally {
  if (keep) console.log(`  workspace kept at ${workspace}`);
  else rmSync(workspace, { recursive: true, force: true });
}
