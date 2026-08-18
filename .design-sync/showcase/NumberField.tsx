/**
 * NumberField — a decimal number.
 *
 * `value` is a **string** on the element, as it is for every Vaadin field; the
 * number is what `min`, `max` and `step` are expressed in. Read the value from
 * the change event and parse it once, at the boundary.
 *
 * `stepButtonsVisible` earns its place when the value is nudged (a quantity, a
 * count) and gets in the way when it is typed (an amount, a year). A unit
 * belongs in the `suffix` slot, not in the label and not in the value.
 */
import { NumberField } from '@vaadin/react-components/NumberField.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const States = () => (
  <div style={column}>
    <NumberField label="Amount" placeholder="0.00" />
    <NumberField label="Amount" value="128.40">
      <span slot="suffix">€</span>
    </NumberField>
    <NumberField label="Amount" value="-5" invalid errorMessage="An amount cannot be negative" min={0} />
  </div>
);

export const Stepped = () => (
  <div style={column}>
    <NumberField label="Attendees" value="4" min={1} max={20} step={1} stepButtonsVisible />
    <NumberField label="VAT rate" value="25.5" step={0.5} min={0} max={100} helperText="Half a percentage point at a time">
      <span slot="suffix">%</span>
    </NumberField>
    <NumberField label="Amount" value="128.40" readonly />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['States', 'Stepped'];
