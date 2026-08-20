# Aura Design System (base)

The **base layer** of a layered design system for Vaadin applications: DTCG design tokens
derived from the Aura theme, canonical `@vaadin/react-components` examples, and the agent-facing
rules in `DESIGN.md`.

This repo ships **mechanism**. Applications ship **policy** in their own overlay repo.

## Why layered

One base design system, many applications. Each application gets an overlay repo that depends on
this package, adds its own brand overrides, and resolves the two into a single flat artifact —
`tokens.resolved.json` — that drives both **generation** (Claude Design / Claude Code prototyping)
and **verification** (DramaFinder's `DesignSpecVerifier`). Same artifact on both ends of the loop,
so a prototype can be checked against the tokens that produced it.

```
aura-design-system  (this repo, published to GitHub Packages)
        │  npm dependency, semver
        ▼
<app>-design  (overlay repo: brand overrides + app components)
        │  CI: resolve.mjs → tokens.resolved.json + design-system/
        ├──► Claude Design (GitHub import + /design-sync)
        └──► DramaFinder DesignSpecVerifier
```

## What Aura actually is

Read this before touching `tokens/tokens.json` — it explains why the file looks the way it does.

Aura is not a set of values. It is a **computation over twenty-two inputs**. Of the 91 public
custom properties its root stylesheets define, 22 are authorable; 66 are derived in the browser at
runtime, and the remaining three are CSS-wide keywords and a raw font stack with no DTCG form:

```css
--vaadin-text-color:  light-dark(var(--aura-neutral-light), var(--aura-neutral-dark));
--vaadin-border-color: color-mix(in srgb, var(--_border-color-base)
                                 calc(14% + 6% * var(--aura-contrast-level)), transparent);
--vaadin-radius-m:     round(var(--aura-base-radius) * 2px + 3px, 1px);
```

`light-dark()`, `oklch(from …)` relative colour, `color-mix()` and `round()` have no DTCG
equivalent — `$value` holds a value, not an expression. So the derived layer **cannot** be
transcribed without freezing it, and freezing it would throw away exactly what makes Aura good:
light/dark, contrast level, surface elevation and pointer density all adapt at runtime, for free.

`tokens/tokens.json` therefore holds Aura's **inputs only**. Change `aura.base.size` and the
entire spacing, radius and control-size scale moves with it, because the browser recomputes it.
The derived surface is captured separately, as a generated snapshot, for tools that need concrete
values (see [The computed snapshot](#the-computed-snapshot)).

One consequence worth knowing up front: **text and border colours are not directly settable.**
Aura derives them from `aura.background.*` and `aura.contrast-level`. An application tunes its
text contrast through those two knobs, not by assigning a text colour.

## The layering contract

Tokens live in two layers:

| Layer | What it is | Example | Emitted as CSS? | Overlays may override? |
|---|---|---|---|---|
| **Primitive** | the raw shared ramp | `aura.palette.blue` | ❌ never | ❌ never |
| **Semantic** | an Aura input, named by role | `aura.accent.light` → `--aura-accent-color-light` | ✅ always | ✅ yes |

The two rules are one rule: **the emitted surface is exactly the override surface.** Every
semantic token names the Aura custom property it maps to; primitives name none, because emitting
one would hand overlays a property they can see but are forbidden to change.

Primitives exist so that roles sharing a value stay independent. `aura.color.blue` (the info
state) and `aura.accent.light` (the brand) both resolve to `{aura.palette.blue}` today. Re-pointing
the brand must not silently recolour every info badge — routing both through a primitive is what
keeps them separable. An overlay that overrode `aura.palette.blue` would move both at once, which
is why `resolve.mjs` **exits 1** when an override targets anything outside the semantic layer.

### The marker

Every token declares its layer under the `com.vaadin.aura` namespace in `$extensions` — the
DTCG-sanctioned place for tool-specific metadata. This is the machine-readable form of the
contract and what the overlay's resolve script checks against.

```jsonc
"palette": {
  "blue": { "$value": "oklch(0.55 0.2 264)",                    // primitive — the raw hue
            "$extensions": { "com.vaadin.aura": { "layer": "primitive" } } }
},
"accent": {
  "light": { "$value": "{aura.palette.blue}",                   // semantic — overlays re-point this
             "$extensions": { "com.vaadin.aura": {
               "layer": "semantic",
               "cssVar": "--aura-accent-color-light" } } }
}
```

`$extensions` rather than a `"$description": "semantic"` convention, so descriptions stay human
prose and the marker stays an exact-match enum with room for further per-token metadata.

`cssVar` names the Aura property the token maps to. It lives here because the base owns that
mapping: without it every overlay would need its own token-path → custom-property table, and
Style Dictionary's derived names (`--aura-accent-light`) don't match Aura's real ones.

Six rules, all enforced by `npm run validate`:

1. **Every token declares a layer.** A token without one is unclassifiable, so the overlay check
   can't decide whether an override is legal. Missing is an error, never an implicit default.
2. **The layer is `primitive` or `semantic`.** Nothing else.
3. **No primitive may reference a semantic token.** That inverts the layering: overriding the
   semantic token in an overlay would then silently move a primitive — the exact failure the
   contract exists to prevent.
4. **Every semantic token has a `cssVar`.** One that is never emitted could be "overridden" with
   no effect whatsoever.
5. **No primitive has a `cssVar`.** Primitives are internal.
6. **No two tokens claim the same `cssVar`.** Otherwise one silently wins and the other override
   does nothing.

> **Mark every token individually.** Style Dictionary inherits `$type` down a group but **not**
> `$extensions`, so a marker on `aura.palette` leaves `aura.palette.blue` unclassified. A test pins
> this behaviour; if it ever changes, that test fails and this rule can be relaxed.

### Staying honest about Aura

`tokens/tokens.json` is a transcription, and transcriptions rot. `@vaadin/aura` is pinned as an
exact devDependency and `npm run check:aura` diffs the tokens against its source, reporting three
things:

| | |
|---|---|
| `DRIFTED` | Aura changed the value behind a token |
| `VANISHED` | a token maps to a property Aura no longer defines |
| `UNTRANSCRIBED` | Aura gained an input we don't model |

`UNTRANSCRIBED` is the one that earns its keep — it turns "Aura added a knob" from something
nobody notices into a failed build. Deliberate omissions are recorded in the `OMITTED` map in
`scripts/check-aura-drift.mjs`, each with the reason it isn't a token; anything not on that list
fails. Bumping Aura is then a real review: run the check, read what moved, decide.

### Reading the marker downstream

`$extensions` survives resolution into the token objects, but **not into every output format**.
Style Dictionary's `json/nested` and `json/flat` reduce each token to its bare value and drop the
marker entirely; `json` preserves it (alongside internal noise like `filePath`). Anything that
needs to reason about layers — the overlay's `resolve.mjs`, or `DesignSpecVerifier` reporting
"this screen hardcodes a primitive" — must therefore either emit `tokens.resolved.json` with a
format that keeps `$extensions`, or read the source tokens rather than the resolved artifact.

### The computed snapshot

Inputs are enough to *build* a theme but not to *verify* one. `DesignSpecVerifier` samples a pixel
and needs an expected colour to compare against, and `aura.contrast-level: 1` is not a colour —
the real value only exists after the browser has evaluated `color-mix()` and `light-dark()`.

So alongside the authored inputs there is a generated snapshot of the derived surface, one file per
colour scheme:

```
tokens/computed/aura-light.computed.json
tokens/computed/aura-dark.computed.json
```

```bash
npm run snapshot         # regenerate both (needs Chromium)
npm run check:snapshot   # is the committed snapshot still the truth? (no browser)
```

`build-computed-snapshot.mjs` loads Aura in headless Chromium, applies the tokens, and reads every
derived property back off a probe element. Reading the custom property directly is not enough —
`getPropertyValue('--vaadin-text-color')` hands back the unevaluated
`light-dark(oklch(from …), …)` token stream — so each value is assigned to a **registered** custom
property (`CSS.registerProperty` with `<color>` / `<length>`) whose computed value the browser is
obliged to resolve. Values that are neither are read through `box-shadow`, `background` or
`font-family`. Sixty-five of the sixty-six derived properties resolve; the one that doesn't is
recorded, with the reason, in the header's `unresolved` list rather than silently dropped.

```jsonc
"--vaadin-text-color": {
  "$type": "color",
  "$value": "oklch(0.15 0.0038 248)",          // the space the browser computed in
  "$extensions": { "com.vaadin.aura": {
    "derived": true,
    "from": ["aura.background.dark", "aura.background.light", "aura.contrast-level"],
    "srgb": "#0a0b0d",                          // what a sampled pixel will hold
    "rgba": [10, 11, 13, 1],
    "alpha": 1 } } }
```

`$type` is DTCG's where DTCG has one: colours carry the resolved value plus its sRGB form,
dimensions are px strings, font stacks are arrays. Shadows and backgrounds carry the resolved CSS
string — DTCG's structured `shadow` and `gradient` types cannot express what Aura computes — which
is one more reason this file is a snapshot and not a token source.

Four decisions are worth knowing, because each one is a fork the file could have taken:

**Compare in sRGB, with a tolerance of 2.** `$value` keeps whatever space the browser computed in —
`oklch()`, `oklab()`, `color(srgb …)` — and none of those match a screenshot byte-for-byte. So every
colour also carries `srgb`/`rgba`, 8-bit, which is the space a sampled pixel is in, and the header
names the tolerance a verifier should allow. Where `alpha < 1` the value must be composited over
the surface behind it before comparing; the header says so too. The generator proves all of this
rather than asserting it: on every run it paints each colour and each length it emits, screenshots
the page, samples the pixels back and fails if any differs by more than the tolerance. The worst
delta across 118 values today is 1.

**Two colour schemes, one density.** `light-dark()` picks a different branch per scheme and neither
is more correct, so both are generated — 27 of the 65 values differ between them. Density is not
multiplied into the files: `pointer: coarse` and `[theme~='small'|'large'|…]` move
`--aura-base-size` and nothing else, and multiplying two schemes by six densities to re-scale one
number is not a trade worth making. The generator takes `--theme small` and `--pointer coarse` for
anyone who needs one, and names the file after the variant, but the committed pair is the default
density.

**Generated, and enforced as generated.** The snapshot is regenerated from `tokens/tokens.json`; if
the two ever disagree, the snapshot is wrong by definition. That is a contract, so it is checked
rather than documented. Each file's header records the Aura release, the Chromium build, and a hash
of the inputs it was generated from, plus a hash of its own body — and `npm run check:snapshot`,
part of `npm run validate`, rejects it four ways:

| | |
|---|---|
| `STALE` | generated from another `@vaadin/aura`, another Chromium, or different inputs |
| `EDITED` | the body no longer hashes to what the generator recorded |
| `COVERAGE` | Aura derives a property the snapshot does not account for — or the snapshot restates an input |
| `MISSING` | a colour scheme has no snapshot at all |

Reformatting the file is fine (the hash is over key-sorted content, not bytes); changing a value is
not. `EDITED` is the rule "never hand-edit this" with teeth, and `COVERAGE` is what makes an Aura
bump that adds a derived property a failed build instead of a quiet omission. Playwright is pinned
exactly, like Aura, because the renderer is part of the provenance: a new Chromium can serialise or
resolve a computed colour differently.

**The base ships the generator; overlays run it.** This snapshot is *unbranded* Aura — its header
proves it, listing the inputs it had to override as `[]`, because `npm run check:aura` guarantees
the tokens match Aura. Once an overlay re-points `aura.accent.light`, every derived colour changes,
so the snapshot that matters for verifying a real application is the overlay's:

```bash
npm i -D playwright && npx playwright install chromium   # the overlay brings the browser
node node_modules/@jcgueriaud1/vaadin-aura-design-system/scripts/build-computed-snapshot.mjs \
  --tokens tokens.resolved.json --out design-system/computed
```

The generator and its checker ship in the package (`scripts/`) for exactly this. An overlay needs
`@vaadin/aura` and `playwright` of its own — the base pins both as devDependencies, and a
devDependency of a dependency is not installed. `tokens.resolved.json` must be emitted in a format
that keeps `$extensions`: the generator reads each token's `cssVar` to know which Aura property it
sets, and `json/flat` throws that away.

Only the inputs that actually differ from Aura's defaults are emitted as CSS. That is not an
optimisation: Aura declares its own inputs at zero specificity (`:where(:root)`), so an override at
`:root` also beats Aura's `@media (pointer: coarse)` and `[theme~='small']` re-declarations of the
same property. Emitting all 22 inputs would pin `--aura-base-size` and silently switch off every
density adaptation — the snapshot would describe a theme nobody runs. **Overlay authors: the same
trap applies to your `theme/tokens.css`.**

The browser is the one cost here. It stays out of `publish.yml`, which gets the hash check for free
inside `npm run validate`; regenerating and re-verifying against real pixels runs in its own
[`snapshot.yml`](.github/workflows/snapshot.yml), only when the tokens, the generator or the pinned
dependencies change.

## Repo layout

```
tokens/tokens.json     DTCG source of truth: Aura's inputs, primitive + semantic
tokens/computed/       GENERATED: the derived surface, one file per colour scheme
DESIGN.md              Global rules, written as agent policy
components/            Canonical @vaadin/react-components examples, six of them
.design-sync/          Durable input for the Claude Design project: config, stories, prompts
sandbox/               Throwaway Vite app that mounts every example and every story
scripts/               Token validation, drift, DESIGN.md, example, coverage and snapshot checks
scripts/lib/           Shared reading of the Aura surface: what is an input, what is derived
test/                  Negative tests for all six
```

The base deliberately ships **no built CSS**. Overlays resolve base + overrides into their own
`tokens.resolved.json` and `theme/tokens.css`, so a base-built stylesheet would be an unbranded
artifact with no consumer — and a generated file in git that drifts from its source.

`components/` examples are not a component library — nothing here is imported at runtime. They are
**few-shot prompts**: exemplary, commented, token-referencing usages of the real Vaadin API, kept
in the repo so an agent reading the design system sees the correct pattern instead of hallucinating
one. Grid renderers, Dialog open/close state, and FormLayout validation are the patterns agents
most often get wrong, so those are the ones that must be exemplary.

### Keeping the examples true

A wrong example is worse than no example: it reads as authority and gets copied. So the claim each
one makes is checked rather than asserted.

| | |
|---|---|
| It compiles | `tsc --noEmit` against the exact pinned `@vaadin/react-components`. This is what rejects the inventions — `columns={[…]}` on a Grid, an untyped renderer signature — because they are type errors, not style opinions. |
| It renders | `sandbox/` mounts every exported example. Compiling proves the props exist; only running proves the pattern works. |
| It obeys DESIGN.md | `scripts/check-examples.mjs` re-applies the rules the document sets for application code — no Lumo, no hardcoded colour, no hardcoded spacing in a style object — to the examples themselves. |
| It says which version it was verified against | Every file carries a `Verified against @vaadin/react-components@x.y.z` line, and the check fails if it disagrees with the pinned dependency. Examples rot silently across majors; this is what turns the bump into a review. |

The render step needs a browser, so it is the one part that isn't in `npm run validate`:

```bash
cd sandbox && npm install && npm run dev
```

It earns its keep. The `FormLayout` example first shipped `fields.every((f) => f.validate())`,
which compiles, passes every static check, and flags exactly one field at a time because `every`
short-circuits. Only rendering it and clicking Submit showed the second field sitting there
unmarked.

### The design-sync project

The examples answer "what is the correct API for this pattern". They do not answer "what does this
component look like in this theme", and they never will — there are six of them and Vaadin ships
79 components. That second question is answered by the
[Claude Design](https://claude.ai/design) project the repo publishes to, where every component in
`@vaadin/react-components` has a card rendered by the real component under the real Aura theme.

`.design-sync/` is the durable input; `ds-bundle/` is derived and gitignored.

```
.design-sync/config.json        the kit, the cards, their groups and viewports
.design-sync/previews/<Name>.tsx  stories driving a curated components/<Name>.tsx example
.design-sync/showcase/<Name>.tsx  stories written straight against the Vaadin API
.design-sync/prompts/<Name>.md    per-component API contract and traps, where one is worth writing
```

Two kinds of card, one pipeline. A config entry with a `source` is one of the six **examples** and
ships that file and its prompt in the card folder. An entry without one is a **showcase**: stories
and nothing else. That split is what lets the project cover every component without pretending each
one has a curated example behind it — and keeps the six that do from being diluted by 47 that don't.

```bash
npm run design:build     # → ds-bundle/, with its own self-check
```

**What a canvas page in that project has to load**, in `<body>` and in this order — worth stating
here because the bundle's own README is the only other place that says it, and a reader who wires a
page up from this repo never sees that file:

```html
<link rel="stylesheet" href="styles.css">   <!-- Aura, plus the host layer below -->
<script src="_vendor/react.js"></script>    <!-- skip both if the host already has React -->
<script src="_vendor/react-dom.js"></script>
<script src="_aura/aura-ds.js"></script>    <!-- exposes window.AuraReact.* -->
```

`_ds_bundle.js` is **not** the runtime, however much the path suggests it: that name belongs to the
Design app, which compiles the project's own `components/**` into it and overwrites anything uploaded
there. A page loading it gets a 200, no `window.AuraReact`, and no error. `<head>` fails too —
`@vaadin/a11y-base` appends a live region to `document.body` at import time.

`styles.css` is Aura's `@import` closure plus a **host layer** the converter appends, because three
things Aura leaves to the application are exactly the three a design system cannot leave to its
consumers: it opts into `color-scheme: light dark` (Aura's documented default is `light`, so without
this the dark half of the theme is unreachable), restates the page background at real `:root`
specificity (Aura declares it under `:where(:root)`, which any host rule beats — and since Aura's
surfaces are 50% translucent by design, losing it means every surface mixes against the host and the
whole screen goes flat grey), and adds the `:root[theme~="dark"]` rule that `_ds_manifest.json`
advertises to the Design app's Dark toggle. Aura defines no dark selector of its own; `color-scheme`
is the only switch. See `hostLayer()` for which upstream gap each rule covers.

**Coverage is checked, not claimed.** `npm run check:showcase` walks the installed package rather
than the config, so the three ways this can rot each fail the build:

| | |
|---|---|
| `UNCOVERED` | in the kit, but with no card, no other card's `covers`, and no omission reason |
| `UNTRANSCRIBED` | the package exports a component and `config.kit` doesn't list it |
| `VANISHED` | `config.kit` lists one the package no longer exports |

`covers` is how a sub-component stays accounted for without a card that would show it out of
context — `GridTreeColumn` is demonstrated by the `GridTree` card, `FormItem` by `FormLayout`.
Deliberate omissions live in `config.omitted` with a reason each, the same contract
`check-aura-drift.mjs` uses. Today there is exactly one: `Iconset`, which renders nothing itself.

The same check applies DESIGN.md §2 and §4 to the story files — they are shipped into the card
folder and read as authority too — and verifies each card's `__order` still matches its exports,
since a story missing from `__order` silently sorts to the end of the card.

What the compiler cannot see, the browser can. The stories in this repo have been rendered and read,
which is how the trap list in `.design-sync/ds-readme.md` was found: `MasterDetailLayout`'s React
wrapper throws on `slot="detail"` children, and its detail area needs an explicit `detailSize` or it
freezes at its content width. Both type-check perfectly.

## Consuming the base

Published to GitHub Packages. Authenticate first — a `GITHUB_TOKEN` (or PAT) with `read:packages`:

```
# .npmrc
@jcgueriaud1:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @jcgueriaud1/vaadin-aura-design-system
```

You normally don't depend on this package from an application directly — you depend on it from the
application's **overlay** repo, which resolves base + overrides and commits the result.

### Minimal overlay

An overlay with an empty `tokens/overrides.json` is valid: it resolves to the base, unchanged.
Add overrides as the brand diverges.

```jsonc
// tokens/overrides.json — semantic layer only
{
  "aura": {
    "accent": {
      "light": { "$value": "oklch(0.58 0.22 290)" },   // brand colour, light scheme
      "dark":  { "$value": "oklch(0.65 0.20 290)" }
    },
    "base": {
      "radius": { "$value": 8 }                        // softer corners everywhere at once
    },
    "contrast-level": { "$value": 2 }                  // raise text/border contrast
  }
}
```

Three values, and the whole theme moves: `base.radius` re-derives `--vaadin-radius-s/m/l`, and
`contrast-level` re-derives text, secondary text, disabled text and both border colours. That
leverage is the reason for keeping the inputs rather than a flattened value set.

## Development

```bash
npm install
npm run validate         # all the checks below, in order
npm run check:aura       # tokens still match the pinned @vaadin/aura
npm run check:design     # every name DESIGN.md recommends still exists
npm run check:components # examples compile against the pinned Vaadin, and obey DESIGN.md
npm run check:showcase   # the design-sync project still covers every Vaadin component
npm run check:snapshot   # the computed snapshot is current, generated and unedited
npm test                 # asserts they all still reject what they should
```

Two commands need a browser and so are not part of `validate`:

```bash
npx playwright install chromium              # once
npm run snapshot         # regenerate tokens/computed/ (self-verifying against real pixels)
npm run snapshot:check   # regenerate in memory and fail if it differs from what is committed
cd sandbox && npm install && npm run dev     # render every example and story
```

`npm test` exists because these scripts are the contract's only enforcement in this repo, and a
check that silently passes everything looks exactly like a check that works — which is precisely
what the original token validation turned out to be. It covers dangling references, a missing
file, an empty token set, every way the layering contract can be violated, every way the tokens
can drift from Aura, stale names in `DESIGN.md`, every rule the examples can break, and every way
the computed snapshot can stop being true — including the two failures that look like success: an
examples directory with nothing in it, and a range-pinned Vaadin that would make every "verified
against" line unfalsifiable.

That last one matters more than it sounds. `DESIGN.md` is read as authority by agents, and a
property Aura has since renamed doesn't error — it resolves to nothing and the element renders
unstyled. `check:design` verifies every property and helper class the document recommends against
the pinned Aura release, exempting `--lumo-*`, which it names in order to forbid.

Token changes are only correct if every reference resolves, every token stays classified, and the
tokens still match the pinned Aura release. Removing or renaming a semantic token is a breaking
change for every overlay.

## Releasing

`.github/workflows/publish.yml` publishes on a **published GitHub Release**. Tag `vX.Y.Z`; the
workflow validates tokens, checks `package.json` version against the tag, and publishes.

Semver applies to the token contract:

- **patch** — primitive value changes that don't alter semantic meaning
- **minor** — new semantic or primitive tokens
- **major** — removing or renaming a semantic token, or changing what one means

## Status

Phase 1 (base repo) is in progress — token extraction, component examples, and `DESIGN.md` are
tracked in the [open issues](../../issues). The first consumer is the Expense Manager overlay.
