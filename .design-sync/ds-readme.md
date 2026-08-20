# Aura — the Vaadin design system, React edition

Every component here is a **real Vaadin web component** driven through its official React wrapper
from `@vaadin/react-components@25.2.8`, skinned by the genuine `@vaadin/aura@25.2.8` theme. Build
with these. Do not hand-roll equivalents, and do not restyle them.

`DESIGN.md` at the project root is the policy file — it is the authority, and three of its rules are
non-negotiable: **Aura is the theme (never Lumo)**, **never hardcode a colour, spacing, radius or
font size**, and **primitives are locked** (an overlay may re-point semantic tokens only).

## Two contexts, two idioms

**In an application** — npm packages, JSX, one import at the entry point:

```bash
npm install @vaadin/react-components@latest-25 @vaadin/aura @vaadin/icons
```

```tsx
import '@vaadin/aura';   // the theme. Once, at the entry point.
import '@vaadin/icons';  // iconsets, next to it.
import { Button } from '@vaadin/react-components/Button.js';
```

`@vaadin/react-components` publishes `latest` = **24.x, the Lumo generation**. Aura needs the 25
line, behind the `latest-25` tag. Getting this wrong is quiet: the app builds, the components
render, and nothing looks like Aura.

**On a canvas page in this project** — four tags, then components off a global:

```html
<link rel="stylesheet" href="styles.css">   <!-- the compiled Aura theme, fonts inlined -->
<script src="_vendor/react.js"></script>
<script src="_vendor/react-dom.js"></script>
<script src="_aura/aura-ds.js"></script>    <!-- exposes window.AuraReact.* -->
```

```jsx
const { Button, TextField, FormLayout } = window.AuraReact;
```

There is **no context provider to wrap**. Without `styles.css` the components render unstyled.
Nothing is fetched from a CDN — the bundle is self-contained.

**Do not paint `body`.** Aura's surfaces are 50% translucent by design — a `Card`, a `Grid`, an input
all mix with what is behind them — and what is meant to be behind them is the app background, which
`styles.css` paints on `:root`. An opaque `body` hides it and every surface flattens into the same
grey: that is what a themed screen with no contrast looks like. `styles.css` sets
`body { background: none }` for this reason, but it is only a default — a `body { background: … }` in
your own page wins on order, so the fix is to not write one. If you need a solid backdrop, move
`--aura-background-color-light` / `-dark` instead, or set `--aura-surface-opacity: 1` to make the
surfaces opaque on purpose.

Put those `<script>` tags in `<body>`, not in `<head>`. The Vaadin elements register as they are
imported, and one of them appends a live region to `document.body` — which is still `null` while the
head is parsing, so a head-loaded bundle dies on `appendChild` before the kit exists.

**`_ds_bundle.js` is not this bundle.** That path belongs to the Design app, which compiles the
project's own `components/**` sources into it and replaces whatever is uploaded there. A page that
loads it gets generated code, no `window.AuraReact`, and no error to show for it — the script 200s
and the globals are simply missing. `_aura/aura-ds.js` is the runtime. If `window.AuraReact` is
`undefined`, that is the first thing to check.

**Bring your own React, 18 or 19.** `_aura/aura-ds.js` uses `window.React` and `window.ReactDOM` as
it finds them: no React of its own, and no element factory of its own either, so it does not care
which of the two versions the host renders with. `_vendor/react.js` and `_vendor/react-dom.js` are
React 19, there for pages that have no React yet — a host that already put React on `window` should
skip that pair rather than load it over its own copy, since the two halves have to be the same
instance. Evaluating `_aura/aura-ds.js` a second time is a no-op, so two components on one page can
each declare it without fighting.

## Styling idiom — `theme` attribute + custom properties, never utility classes

This design system has **no CSS class vocabulary**. Style in exactly two ways.

**1. Variants via the `theme` prop**, a space-separated list composing independent axes:

- prominence — *(default)* | `primary` | `tertiary` (there is no `secondary`; the default *is* secondary)
- state — `danger` | `error` | `success` | `warning` | `info`
- density — `xsmall` | `small` | `medium` | `large` | `xlarge`, and **inherited**: set it on a layout,
  not on each control

```jsx
<Button theme="primary danger">Delete permanently</Button>
```

A state variant re-points `--aura-accent-color` for that subtree, so fill, text, border and focus
ring move together and stay mutually legible. `background: red` gets you a red box with an
unreadable label and a blue focus ring. For non-component regions the same thing is available as
classes: `.aura-accent-red|green|yellow|blue|orange|purple|neutral`, plus `.aura-surface`,
`.aura-surface-solid`, `.aura-accent-surface`.

**2. Your own layout and chrome via Aura's custom properties:**

- **Spacing** — `--vaadin-gap-xs|s|m|l|xl` between items, `--vaadin-padding-xs|s|m|l|xl` inside a
  container. Use `gap` on the layout, not margins on children.
- **Radius** — `--vaadin-radius-s|m|l`. You rarely set it: components already pick a step.
- **Field width** — fields are `12em` wide by default, from `--vaadin-field-default-width`. Move that
  property to change the default everywhere, and note it also sets `FormLayout`'s column width. It
  takes a length, **not a percentage**: `--vaadin-field-default-width: 100%` resolves against the
  column it is defining and collapses the field to its content width instead of filling. To make one
  field fill its container, give the field `width: 100%`, or put it in a parent that stretches it — a
  `display: flex; flex-direction: column`, or a `VerticalLayout`, which is the idiomatic answer.
- **Type** — `--aura-font-size-xs|s|m|l|xl` paired with the *matching*
  `--aura-line-height-xs|s|m|l|xl`; never mix steps. Weights
  `--aura-font-weight-regular|medium|semibold`. `h1`–`h6` are already styled — pick the right level
  instead of restyling a `div`.
- **Colour** — `--vaadin-text-color`, `--vaadin-text-color-secondary`, `--vaadin-border-color`,
  `--vaadin-background-container`, `--aura-accent-color`, `--aura-accent-text-color`,
  `--aura-accent-contrast-color`, `--aura-accent-surface`, `--aura-surface-color`,
  `--vaadin-focus-ring-color`. Accent **text** on a surface uses `--aura-accent-text-color`, not
  `--aura-accent-color` — the plain accent is tuned as a fill.
- **Elevation** — `--aura-shadow-xs|s|m`. Three steps is the whole scale.

A literal `#hex`, `rgb()`, `px` spacing or `rem` font size is a defect. Narrow exceptions: `0`,
`1px` hairlines, and geometry that isn't design-system spacing.

Aura is a **computed** theme: of its 91 root custom properties only ~32 are authorable inputs, and
the rest are derived at runtime via `light-dark()`, `oklch(from …)`, `color-mix()` and `round()`.
That is why you move a knob (`--aura-base-size`, `--aura-base-radius`, `--aura-contrast-level`)
instead of assigning a value — the whole system re-derives together. `tokens/tokens.json` holds the
inputs; `guidelines/tokens.html` shows what they derive to.

**Knobs go on the root.** They look like ordinary custom properties, and they inherit like ordinary
custom properties, but what they feed does not: Aura derives from them inside rules whose selector is
`:where(:root), :where(:host)`, so a knob set further down the tree inherits into a subtree where
nothing re-derives, and changes nothing. Setting `--aura-contrast-level: 3` on a `<div>` is inert —
silently, which is the part that costs time. One partial exception, and it is the mechanism behind the
density variants: spacing and type *are* re-derived under `:where([theme])`, so `--aura-base-size` and
`--aura-base-font-size` do take effect on an element carrying a `theme` attribute. Radius does not
follow — `--vaadin-radius-s|m|l` derive under `:where(:root), :where(:host)` only — so
`--aura-base-radius` is root-or-nothing, as is `--aura-contrast-level`.

## Dark mode

Dark mode is the CSS `color-scheme` property, and nothing else. Aura has no dark stylesheet and no
dark class: every dark value is the second branch of a `light-dark()` call, and `light-dark()` reads
the element's used `color-scheme`. `styles.css` already opts in, so **a page follows the operating
system with no work at all**:

```css
:root { color-scheme: light dark; }   /* already in styles.css */
```

To force one scheme, set `color-scheme` on the root, or use the attribute this bundle adds for the
Design app's Dark toggle:

```html
<html theme="dark">     <!-- or: :root { color-scheme: dark } -->
```

Put it on the root and nowhere else. Six colour properties — `--vaadin-text-color`, its secondary and
disabled variants, both border colours, and `--vaadin-background-color` — are registered as `<color>`
via `CSS.registerProperty`, so they resolve their `light-dark()` where they are *declared*, at
`:root`, and descendants inherit an already-resolved colour. Flip the scheme on a `<div>` and the
surfaces and accent go dark while the text and borders stay light: a half-dark subtree, measured, not
theorised.

`data-theme` is not a Vaadin API and never was — if you have seen it recommended for Aura, that was
wrong. In Flow the equivalents are the `@ColorScheme` annotation and `Page::setColorScheme()`.

Two dark values are authorable, and everything else derives from them:

```css
:root {
  --aura-background-color-dark: oklch(0.2 0.01 260);   /* the dark page colour */
  --aura-accent-color-dark: var(--aura-blue);          /* the dark accent */
}
```

Text, secondary text, disabled text, both border colours, the surfaces, accent text and contrast, and
the focus ring are all derived from those two plus `--aura-contrast-level`. There is no dark palette
to fill in.

Aura's own two `color-scheme` knobs are for overlays, not for the page:
`--aura-content-color-scheme` covers the App Layout content area and `--aura-notification-color-scheme`
covers notifications, so a dialog or a toast can hold a different scheme than the page behind it.

## Accessibility, non-optionally

Every input needs a programmatic label (`label`, or `aria-label` where a visible label genuinely
doesn't fit — a placeholder is not a label). Icon-only buttons need **both** an accessible name and a
tooltip. Focus must stay visible. Never set a pixel height on a control: Aura grows controls under
`@media (pointer: coarse)` and a fixed height is a tap-target failure. Raise `--aura-contrast-level`
rather than hand-picking darker colours. Colour is never the only signal.

## Choosing a component

| Use | When | Instead of |
|---|---|---|
| `Grid` | tabular data, columns, sorting | a hand-rolled `<table>` |
| `VirtualList` | long non-tabular custom-rendered lists | `Grid` with one column |
| `Select` | short fixed option set, no typing | `ComboBox`, native `<select>` |
| `ComboBox` | long or filterable set, type-to-find | `Select` with 200 options |
| `Dialog` | a blocking decision or short task | a route, a full page |
| `FormLayout` | any multi-field form | a stack of divs |
| `Notification` | transient confirmation | a `Dialog` to dismiss |

A `Grid` with one column is a `VirtualList`. A `Dialog` that opens another `Dialog` is a route.

## What is here, and which files to read

Every component `@vaadin/react-components` ships is on `window.AuraReact` and has a card. Cards come
in two kinds, and the difference tells you how much weight the file carries:

|  | Files in the card folder | What it is |
|---|---|---|
| **Example** — Button, Select, ComboBox, FormLayout, Grid, Dialog | `<Name>.tsx`, `<Name>.prompt.md`, `<Name>.stories.tsx` | A curated few-shot example. `<Name>.tsx` is checked by `tsc` against the pinned version and rendered in CI's harness; the prompt file states the API contract and its traps. These six are the patterns most often got wrong. |
| **Showcase** — everything else | `<Name>.stories.tsx` | Stories written straight against the Vaadin API, one per variant or state worth seeing. Type-checked the same way. The header comment of the file is the guidance — read it. |

- `DESIGN.md` — the checkable rules. Read it before generating UI code.
- `components/<group>/<Name>/<Name>.prompt.md` — where it exists, the API contract and its traps.
  **Read this before composing that component.**
- `components/<group>/<Name>/<Name>.tsx` — the canonical example, compiled and rendered against the
  pinned version. Prefer reading it over reconstructing the API from memory.
- `components/<group>/<Name>/<Name>.stories.tsx` — every card has one. For a showcase it *is* the
  source, and its header comment says what the component is for and what to avoid.
- `styles.css` — the compiled Aura theme (the `@import` closure of `@vaadin/aura`, fonts inlined).
- `tokens/tokens.json` — Aura's authorable inputs, as DTCG.

### Wrapper traps the cards exist to record

A React wrapper is usually a thin pass-through, and these are the places it is not — each one
compiles, or type-checks, and then misbehaves:

- Fields use **`readonly`**, not React's `readOnly`. The latter is dropped and the field stays editable.
- `Markdown` takes its source as **children**, not the `content` prop the element has.
- `MasterDetailLayout` requires `MasterDetailLayout.Master` / `.Detail` / `.DetailPlaceholder`
  children and **throws** on anything else — `slot="detail"` is right for the element and wrong here.
- A non-standard attribute on a **host** element must be spread: `<div {...{ tab: 'details' }}>`,
  never `tab="details"`. Same for `theme` on a plain `<div>`.
- `Grid` and `VirtualList` renderers receive `{ item, model, original }` — the row index is
  `model.index`, and there is no top-level `index`.

## One idiomatic screen

```jsx
const { Card, FormLayout, TextField, EmailField, Button, HorizontalLayout } = window.AuraReact;

function InviteCard() {
  return (
    <Card style={{ maxWidth: 420 }}>
      <div style={{ display: 'grid', gap: 'var(--vaadin-gap-m)', padding: 'var(--vaadin-padding-l)' }}>
        <h3 style={{ margin: 0 }}>Invite teammate</h3>
        <FormLayout autoResponsive autoRows maxColumns={1}>
          <TextField label="Full name" required errorMessage="Who are you inviting?" />
          <EmailField label="Email" required errorMessage="A valid work address is required" />
        </FormLayout>
        <HorizontalLayout style={{ gap: 'var(--vaadin-gap-s)', justifyContent: 'flex-end' }}>
          <Button theme="tertiary">Cancel</Button>
          <Button theme="primary">Send invite</Button>
        </HorizontalLayout>
      </div>
    </Card>
  );
}
```

**Content voice:** sober, second person, sentence case ("Send invite", not "Send Invite!"). No emoji
and no unicode-as-icon — use `<Icon icon="vaadin:…">`.
