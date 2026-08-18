/**
 * TextField — and with it the state matrix every Vaadin field shares.
 *
 * `required`, `invalid`, `errorMessage`, `helperText`, `disabled`, `readonly`
 * and `clearButtonVisible` mean the same thing on TextArea, EmailField,
 * NumberField, Select, ComboBox and the pickers. Learn them here once.
 *
 * A field renders its own label and its own error message: `label` is a prop,
 * not a sibling `<label>`, and `errorMessage` appears only while `invalid` is
 * set. Wrapping a field in bespoke validation markup duplicates what it already
 * does and desynchronises from its `invalid` state (DESIGN.md §9).
 *
 * `readonly` and `disabled` are different: a readonly field is still focusable
 * and readable by a screen reader, a disabled one leaves the tab order entirely,
 * so the reason it is disabled has to be visible elsewhere (DESIGN.md §7).
 *
 * Note the spelling: **`readonly`**, lower-case, because it is a web component
 * property and not React's `readOnly` on a native input. React would accept
 * `readOnly` on a host element and drop it silently — the field would simply
 * stay editable — so this is one to take from the type, not from memory.
 */
import { TextField } from '@vaadin/react-components/TextField.js';
import { Icon } from '@vaadin/react-components/Icon.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const States = () => (
  <div style={column}>
    <TextField label="Merchant" placeholder="Who was paid" />
    <TextField label="Merchant" value="Stockmann" helperText="As printed on the receipt" />
    <TextField label="Merchant" required errorMessage="Merchant is required" invalid />
  </div>
);

export const NotEditable = () => (
  <div style={column}>
    <TextField label="Merchant" value="Stockmann" readonly />
    <TextField label="Merchant" value="Stockmann" disabled />
    <TextField label="Reference" value="EXP-2291" readonly helperText="Assigned when the expense is created" />
  </div>
);

/** Prefix and suffix are **slots** — slotted children, not props. */
export const Affixes = () => (
  <div style={column}>
    <TextField label="Search">
      <Icon slot="prefix" icon="vaadin:search" />
    </TextField>
    <TextField label="Cost centre" value="FI-100" clearButtonVisible />
    <TextField label="Domain" value="vaadin">
      <span slot="suffix">.com</span>
    </TextField>
  </div>
);

/** Size is inherited from the container — never a pixel height (DESIGN.md §5). */
export const Sizes = () => (
  <div style={column}>
    <TextField theme="small" label="Small" value="theme=small" />
    <TextField label="Medium" value="default" />
    <TextField theme="large" label="Large" value="theme=large" />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['States', 'NotEditable', 'Affixes', 'Sizes'];
