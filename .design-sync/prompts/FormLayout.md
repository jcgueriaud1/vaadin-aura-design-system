`FormLayout` + fields — forms and validation. `import { FormLayout } from '@vaadin/react-components/FormLayout.js';`

**The field renders its own error message.** Every Vaadin field carries `required`, `errorMessage`,
`invalid` and a `validate()` method, and paints the message in its own error slot with the right
colour, spacing and `aria-describedby`. A `<span className="error">` under the field duplicates the
message and desynchronises from `invalid` (DESIGN.md §9).

There is **no `<Form>` component**. A submit handler validates the fields it owns via refs:

```jsx
const results = [merchant, email, amount].map((f) => f.current?.validate() ?? false);
if (!results.every(Boolean)) return;
```

- `map` then check — never `fields.every((f) => f.validate())`. `every` short-circuits, so later
  fields never validate and never show their message; the user meets one error at a time.
- `validate()` sets `invalid` (that's what makes messages appear); `checkValidity()` is the read-only
  variant — use it to enable a button without flagging an untouched field.
- Two layout modes: `responsiveSteps={[{ minWidth: 0, columns: 1 }, { minWidth: '40em', columns: 2 }]}`
  for explicit breakpoints, or `autoResponsive autoRows maxColumns={2} expandColumns` for
  measurement-based fitting — prefer auto for forms in a drawer or split pane, where the viewport
  width isn't what varies.
- Server-side validation: set `manualValidation` and own `invalid` + `errorMessage` yourself, or the
  field re-validates on blur and clears your message. Validate on `onChange` (blur/Enter), not on
  every keystroke.
- Every field needs a `label` (DESIGN.md §7).
- **Column width comes from the field, not the layout.** Both modes size their columns from
  `--vaadin-field-default-width`, which defaults to `12em` — so a form looks narrow because the
  *fields* are 12em, and the fix is that property on `:root`, not a `width` on the layout. It takes a
  length: `--vaadin-field-default-width: 100%` resolves against the column it is defining and
  collapses the field to its content width. A single field fills its container with `width: 100%` on
  the field, or by sitting in a parent that stretches it (`display: flex; flex-direction: column`, or
  a `VerticalLayout`).
