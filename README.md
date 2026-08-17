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

## The layering contract

Tokens live in two layers:

| Layer | Example | Overlays may override? |
|---|---|---|
| **Primitive** | `color.blue.600`, `space.400` | ❌ never |
| **Semantic** | `color.primary`, `space.card-padding` | ✅ yes |

Primitives are the raw scale. Semantic tokens are the *meanings* an application is allowed to
re-point. An overlay that overrides `color.blue.600` would silently change every semantic token
that aliases it, in ways the base can't reason about — so the overlay's `resolve.mjs` **exits 1**
when an override targets a token outside the semantic layer.

### The marker

Every token declares its layer under the `com.vaadin.aura` namespace in `$extensions` — the
DTCG-sanctioned place for tool-specific metadata. This is the machine-readable form of the
contract and what the overlay's resolve script checks against.

```jsonc
"color": {
  "blue": {
    "600": { "$value": "#2563eb",                                    // primitive — locked
             "$extensions": { "com.vaadin.aura": { "layer": "primitive" } } }
  },
  "primary": { "$value": "{color.blue.600}",                         // semantic — overlays may re-point
               "$description": "Primary action colour",
               "$extensions": { "com.vaadin.aura": { "layer": "semantic" } } }
}
```

`$extensions` rather than a `"$description": "semantic"` convention, so that descriptions stay
human prose and the marker stays an exact-match enum with room for further per-token metadata.

Three rules, all enforced by `npm run validate`:

1. **Every token declares a layer.** A token without one is unclassifiable, so the overlay check
   can't decide whether an override is legal. Missing is an error, never an implicit default.
2. **The layer is `primitive` or `semantic`.** Nothing else.
3. **No primitive may reference a semantic token.** That inverts the layering: overriding the
   semantic token in an overlay would then silently move a primitive — the exact failure the
   contract exists to prevent.

> **Mark every token individually.** Style Dictionary inherits `$type` down a group but **not**
> `$extensions`, so a marker on `color.gray` leaves `color.gray.50` unclassified. A test pins this
> behaviour; if it ever changes, that test fails and this rule can be relaxed.

### Reading the marker downstream

`$extensions` survives resolution into the token objects, but **not into every output format**.
Style Dictionary's `json/nested` and `json/flat` reduce each token to its bare value and drop the
marker entirely; `json` preserves it (alongside internal noise like `filePath`). Anything that
needs to reason about layers — the overlay's `resolve.mjs`, or `DesignSpecVerifier` reporting
"this screen hardcodes a primitive" — must therefore either emit `tokens.resolved.json` with a
format that keeps `$extensions`, or read the source tokens rather than the resolved artifact.

## Repo layout

```
tokens/tokens.json     DTCG source of truth: primitives + semantic layer
components/            Canonical @vaadin/react-components examples, one per component
DESIGN.md              Global rules, written as agent policy
scripts/               Token validation
test/                  Negative tests for the validator
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
  "color": {
    "primary": { "$value": "{color.blue.500}" },
    "brand":   { "$value": "#7c3aed" }
  },
  "radius": { "medium": { "$value": "0.75rem" } }
}
```

## Development

```bash
npm install
npm run validate     # tokens.json parses as DTCG and every $value reference resolves
npm test             # asserts the validator still rejects what it should
```

`npm test` exists because the validator is the contract's only enforcement point in this repo, and
a validator that silently passes everything looks exactly like a validator that works. It checks
the negative cases: dangling references, a missing file, an empty token set, and each way the
layering contract can be violated.

Token changes are only correct if every reference still resolves *and* the semantic layer still
covers what overlays are promised: surface / text / primary / brand colors, the spacing aliases,
radius, and the base font family. Removing or renaming a semantic token is a breaking change for
every overlay.

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
