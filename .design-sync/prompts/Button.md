`Button` — actions. `import { Button } from '@vaadin/react-components/Button.js';`

`theme` is a **space-separated list** composing three independent axes:

- prominence — *(default)* | `primary` | `tertiary` (there is no `secondary`; the default *is* secondary)
- state — `danger` | `error` | `success` | `warning` | `info`
- size — `xsmall` | `small` | `medium` | `large` | `xlarge`

```jsx
<Button theme="primary danger" onClick={remove}>Delete permanently</Button>
```

Rules:

- **One `primary` per view** — the single action the screen exists for.
- A state variant re-points `--aura-accent-color` for that element, so fill, label, border and focus
  ring move together. `theme="danger"` is how a destructive button turns red; `style={{ background: 'red' }}`
  gets you a red box with an unreadable label and a blue focus ring (DESIGN.md §6).
- Icons go in the `prefix`/`suffix` **slots** — `<Icon slot="prefix" …/>` as a child, not a prop. An
  icon in the default slot is how Aura recognises an icon-only button.
- **Icon-only needs both** an `aria-label` and a `<Tooltip slot="tooltip" …/>` (DESIGN.md §7).
- Set size on the container, not per control — `theme` is inherited. Never set a pixel height: Aura
  grows controls under `@media (pointer: coarse)` and a fixed height defeats it (DESIGN.md §5).
- `disabled` removes the button from the tab order, so the reason must be visible elsewhere — a
  helper text or a validation message, not a tooltip nobody can reach.
