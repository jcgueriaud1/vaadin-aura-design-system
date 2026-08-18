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

**On a canvas page in this project** — two tags, then components off a global:

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

## Dark mode

Set both attributes on the root: `<html theme="dark" data-theme="dark">`.

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

## Where the truth lives

- `DESIGN.md` — the checkable rules. Read it before generating UI code.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component API contract and traps. **Read this
  before composing a component.**
- `components/<group>/<Name>/<Name>.tsx` — the canonical example, compiled and rendered against the
  pinned version. Prefer reading it over reconstructing the API from memory.
- `components/<group>/<Name>/<Name>.stories.tsx` — how the card renders that example.
- `styles.css` — the compiled Aura theme (the `@import` closure of `@vaadin/aura`, fonts inlined).
- `tokens/tokens.json` — Aura's authorable inputs, as DTCG.

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
