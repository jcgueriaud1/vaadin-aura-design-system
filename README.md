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

Aura is not a set of values. It is a **computation over about twenty inputs**. Of the 91 custom
properties its root stylesheets define, only 32 are authorable; the other 59 are derived in the
browser at runtime:

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
values (see [Reading the marker downstream](#reading-the-marker-downstream)).

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

So alongside the authored inputs there is a generated snapshot of the derived surface, produced by
loading Aura in a headless browser and reading `getComputedStyle` per colour scheme. It is
explicitly **not authoritative**: never hand-edited, regenerated from the inputs, and consumed only
by tools that need concrete values — verification, and generators that want a real hex to show.
Not yet built; tracked in [#7](../../issues/7).

## Repo layout

```
tokens/tokens.json     DTCG source of truth: Aura's inputs, primitive + semantic
DESIGN.md              Global rules, written as agent policy
components/            Canonical @vaadin/react-components examples, one per component
scripts/               Token validation, Aura drift check, DESIGN.md name check
test/                  Negative tests for all three
```

The base deliberately ships **no built CSS**. Overlays resolve base + overrides into their own
`tokens.resolved.json` and `theme/tokens.css`, so a base-built stylesheet would be an unbranded
artifact with no consumer — and a generated file in git that drifts from its source.

`components/` examples are not a component library — nothing here is imported at runtime. They are
**few-shot prompts**: exemplary, commented, token-referencing usages of the real Vaadin API, kept
in the repo so an agent reading the design system sees the correct pattern instead of hallucinating
one. Grid renderers, Dialog open/close state, and FormLayout validation are the patterns agents
most often get wrong, so those are the ones that must be exemplary.

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
npm run validate       # all three checks below, in order
npm run check:aura     # tokens still match the pinned @vaadin/aura
npm run check:design   # every name DESIGN.md recommends still exists
npm test               # asserts all three still reject what they should
```

`npm test` exists because these scripts are the contract's only enforcement in this repo, and a
check that silently passes everything looks exactly like a check that works — which is precisely
what the original token validation turned out to be. It covers dangling references, a missing
file, an empty token set, every way the layering contract can be violated, every way the tokens
can drift from Aura, and stale names in `DESIGN.md`.

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
