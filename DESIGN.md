# Aura design rules

Policy for anything generating or reviewing UI code against this design system — agents first,
humans welcome. Every rule here is meant to be **checkable**: you should be able to look at a diff,
or at a rendered screen, and say whether it holds. Rules that can't be checked don't belong here.

Verified against `@vaadin/aura@25.2.8` and `@vaadin/react-components@25.2.8`.

---

## 1. Non-negotiable

1. Aura is the theme. Never Lumo. → [§2](#2-the-theme-is-aura)
2. Never hardcode a colour, spacing, radius or font size. Use Aura's custom properties. → [§4](#4-never-hardcode-a-value)
3. Overlays may re-point semantic tokens only. Primitives are locked. → [§3](#3-the-layering-contract)

Everything else is guidance you may depart from with a reason. These three are enforced — by CI in
this repo and the overlay, and by `DesignSpecVerifier` against rendered output.

---

## 2. The theme is Aura

Load it once, at the application entry point:

```ts
import '@vaadin/aura';   // resolves to aura.css
```

### Install the right major

`@vaadin/react-components` publishes **`latest` = 24.x**, which is the Lumo generation. Aura needs
the 25 line, which lives behind a separate tag:

```bash
npm install @vaadin/react-components@latest-25   # 25.2.8 — correct
npm install @vaadin/react-components             # 24.9.17 — wrong generation, no Aura
```

Getting this wrong is quiet: the app builds, the components render, and nothing looks like Aura.
If a screen looks generically Vaadin rather than Aura, check the installed major first.

### Never import Lumo

`@vaadin/react-components` ships exactly one CSS export, and it is a Lumo one:

```ts
import '@vaadin/react-components/css/lumo/Utility.module.css';   // ❌ never
```

Its utility classes are written against `--lumo-*` properties, which Aura does not define. In an
Aura app they resolve to nothing, so `className="text-xs"` silently produces unstyled text rather
than an error.

**Rule:** no `--lumo-*` property may appear in application code, and nothing under
`@vaadin/react-components/css/lumo/` may be imported. Both are greppable; treat a hit as a defect.

---

## 3. The layering contract

Tokens live in two layers, marked per token in `tokens/tokens.json`:

```jsonc
"$extensions": { "com.vaadin.aura": { "layer": "semantic", "cssVar": "--aura-accent-color-light" } }
```

| Layer | What it is | Overlay may override |
|---|---|---|
| `primitive` | the raw shared ramp (`aura.palette.blue`) | ❌ never |
| `semantic` | an Aura input, named by role (`aura.accent.light`) | ✅ yes |

The emitted CSS surface is exactly the override surface: semantic tokens carry the `cssVar` they
map to, primitives carry none. An overlay override that targets a primitive **fails CI** — because
roles share primitives, and moving one must not silently move the others.

### Aura's inputs are knobs, not values

Aura derives 66 of its 91 public properties at runtime from 22 inputs. Change one input and
everything downstream re-derives, in the browser, for free:

| Change this | And this moves with it |
|---|---|
| `aura.base.size` | every gap, padding and control size |
| `aura.base.radius` | `--vaadin-radius-s/m/l` |
| `aura.contrast-level` | text, secondary text, disabled text, both border colours |
| `aura.accent.light/dark` | accent, accent text, accent surface, accent border, focus ring |

Prefer moving a knob over overriding a derived property. Setting `--vaadin-radius-m` directly
changes one radius; setting `aura.base.radius` keeps the scale coherent.

### Text and border colours are not settable

There is no token for text colour. Aura derives `--vaadin-text-color`, its secondary and disabled
variants, and both border colours from `aura.background.*` and `aura.contrast-level`. To make text
darker, raise `aura.contrast-level` — do not assign a colour. This surprises people; it is working
as designed.

---

## 4. Never hardcode a value

Use these. They are the properties Aura actually defines, and the values `DesignSpecVerifier`
expects to find when it samples a rendered screen. What each one resolves to in the base theme is in
`tokens/computed/aura-light.computed.json` and its dark twin — generated, so read them, never edit
them.

**Spacing** — `--vaadin-gap-xs|s|m|l|xl` between items, `--vaadin-padding-xs|s|m|l|xl` inside a
container. Use `gap` on the layout rather than margins on children; Aura's layout components
already consume `--vaadin-padding-l` for their own margin and padding.

**Radius** — `--vaadin-radius-s|m|l`. Roughly: `s` for small chrome (cards, tooltips, date
pickers), `m` for panels and inline containers (tabs, accordions, upload), `l` for app-level
surfaces and overlays. You rarely set it yourself — components already pick a step, and many
expose their own knob (`--vaadin-tab-border-radius`, `--vaadin-popover-border-radius`). To change
the feel of the whole app, move `aura.base.radius`; all three steps re-derive together.

**Typography** — `--aura-font-size-xs|s|m|l|xl` paired with the matching
`--aura-line-height-xs|s|m|l|xl`. Never mix a size from one step with a line height from another.
Weights: `--aura-font-weight-regular|medium|semibold`. Headings `h1`–`h6` are already styled — use
the right level rather than restyling a `div`.

**Colour** — `--vaadin-text-color`, `--vaadin-text-color-secondary`, `--vaadin-text-color-disabled`,
`--vaadin-border-color`, `--vaadin-border-color-secondary`, `--vaadin-background-container`,
`--vaadin-background-container-strong`, `--aura-accent-color`, `--aura-accent-text-color`,
`--aura-accent-contrast-color`, `--aura-accent-surface`, `--aura-accent-border-color`,
`--aura-surface-color`, `--vaadin-focus-ring-color`.

**Elevation** — `--aura-shadow-xs|s|m`. Nothing custom; three steps is the whole scale.

Accent text on a surface must use `--aura-accent-text-color`, not `--aura-accent-color`. The plain
accent is tuned to be a *fill*; the text variant is lightness-corrected to stay legible. Same for
the six hues: `--aura-red-text` and friends exist for exactly this.

A literal `#hex`, `rgb()`, `px` spacing or `rem` font size in application code is a defect. The
narrow exceptions: `0`, `1px` hairlines, and geometry that isn't design system spacing (a sprite
offset, a canvas coordinate).

---

## 5. Density

Density is a theme attribute, not a stylesheet. Aura scales the entire system from `--aura-base-size`:

```tsx
<div theme="small">…</div>   {/* xsmall | small | medium | large | xlarge */}
```

Aura also bumps the base size to 18 under `@media (pointer: coarse)`, so touch targets grow without
any application code. **Do not defeat this** by setting fixed pixel heights on controls — a control
with `height: 32px` stays 32px on a touch device and becomes a tap-target failure.

---

## 6. Colour and state

State is expressed by re-pointing the accent, not by assigning colours:

```tsx
<Button theme="danger">Delete</Button>     {/* danger | error | success | warning | info */}
```

Each maps the accent to the corresponding hue for that subtree, so the button's fill, text,
surface, border and focus ring all move together and stay mutually legible. Assigning
`background: red` gets you a red box with unreadable text and a blue focus ring.

For non-component regions the same thing is available as classes: `.aura-accent-red`,
`.aura-accent-green`, `.aura-accent-yellow`, `.aura-accent-blue`, `.aura-accent-orange`,
`.aura-accent-purple`, `.aura-accent-neutral`, plus `.aura-surface` / `.aura-surface-solid` for
surfaces and `.aura-accent-surface` for a tinted one.

Never use colour as the only signal. An error state needs text or an icon as well as a red accent.

---

## 7. Accessibility

- **Contrast** is a knob: `aura.contrast-level`. Raise it rather than hand-picking darker colours.
  Aura's derivations keep the whole system consistent at the new level; a hand-picked colour fixes
  one element and desynchronises the rest.
- **Focus must stay visible.** `--vaadin-focus-ring-color` is derived to contrast with the accent.
  Never `outline: none` without an equally visible replacement.
- **Every input needs a programmatic label** — a `label` prop, or `aria-label` where a visible
  label genuinely doesn't fit. Placeholder text is not a label; it disappears on focus.
- **Keyboard reachability**: every action must be reachable and operable by keyboard. Anything
  interactive that isn't a real control needs a role, `tabIndex`, and Enter/Space handling — which
  is the argument for using the real component instead.
- **Don't defeat touch sizing** — see [§5](#5-density).
- Icon-only buttons need an accessible name and a tooltip.

---

## 8. Choosing a component

| Use | When | Instead of |
|---|---|---|
| `Grid` | tabular data, columns, sorting, selection | a hand-rolled `<table>` |
| `VirtualList` | long non-tabular lists of custom-rendered items | `Grid` with one column |
| `Select` | short fixed set of options, no typing | `ComboBox`, a native `<select>` |
| `ComboBox` | long or filterable option set, type-to-find | `Select` with 200 options |
| `Dialog` | a decision or a short focused task that blocks | a route, a full page |
| inline editing | editing one field in place | a `Dialog` per field |
| `FormLayout` | any multi-field form | a stack of divs |
| `Notification` | transient confirmation | a `Dialog` the user must dismiss |

Two judgement calls worth stating outright. **A `Grid` with a single column is a `VirtualList`** —
you're paying for column machinery you don't use. **A `Dialog` that opens another `Dialog` is a
route** — nested modals trap keyboard focus and strand users; use a page.

---

## 9. React API rules

These are the wrapper contracts agents most often get wrong. Verified against the shipped `.d.ts`.
Each has a worked example in `components/`, compiled and rendered against the pinned version — read
the example rather than reconstructing the API from memory.

**Grid column renderers are component types, not elements.** `GridColumn`'s `children` and
`renderer` are typed `ComponentType<GridBodyReactRendererProps<TItem>>`, and receive
`{ item, model, original }` — not `item` directly:

```tsx
<GridColumn<Expense> header="Amount">
  {({ item }) => <span>{format(item.amount)}</span>}
</GridColumn>
```

**`header` and `footer` take `ReactNode`.** `headerRenderer` and `footerRenderer` still exist but
are **deprecated** — use `header` / `footer`.

**`Grid` and `GridColumn` are generic.** Pass the item type (`<Grid<Expense>>`) or every renderer
degrades to `GridDefaultItem` and you lose the typing that makes the pattern worth using.

**`Dialog` is controlled.** Drive `opened` and listen to `onOpenedChanged`; the component closes
itself on Escape and backdrop click, and a `useState` toggle that ignores the event desynchronises.
Content goes in `children`, `header` and `footer`.

**Vaadin fields are not native inputs.** They validate themselves and render their own error
messages; don't wrap them in bespoke validation markup. Read values from the component's change
event rather than reaching into the DOM.

---

## 10. Overlays

An overlay **extends** this file; it does not replace it. The assembled `design-system/` folder
ships both side by side — base rules and app rules as separate files — so provenance stays clear
and a base update doesn't silently rewrite app policy.

Where they conflict the overlay wins, with two exceptions it cannot relax: **the layering
contract** ([§3](#3-the-layering-contract)) and **Aura-only** ([§2](#2-the-theme-is-aura)). An
overlay that needs to break either has outgrown the design system, and that's a conversation, not
a config change.

Good overlay rules are the ones this file can't know: which of the six hues means what in this
domain, the app's empty and loading states, when to use a Dialog versus a route *in this product*.
