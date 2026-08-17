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

Semantic tokens are marked in `tokens/tokens.json`; the marker is the machine-readable form of
this contract and is what the resolve script checks against.

```jsonc
"color": {
  "blue":    { "600": { "$value": "#2563eb" } },          // primitive — locked
  "primary": { "$value": "{color.blue.600}",              // semantic — overlays may re-point
               "$description": "semantic" }
}
```

## Repo layout

```
tokens/tokens.json     DTCG source of truth: primitives + semantic layer
theme/                 Built CSS custom properties (generated)
components/            Canonical @vaadin/react-components examples, one per component
DESIGN.md              Global rules, written as agent policy
```

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
npm run validate     # style-dictionary parses tokens.json, all $value references resolve
```

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
