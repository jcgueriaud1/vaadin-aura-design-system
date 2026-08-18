/**
 * RadioGroup — one value out of a few visible options.
 *
 * RadioButton is never used on its own: the group owns the value, the label and
 * the arrow-key navigation between options, and a loose radio button belongs to
 * no group at all.
 *
 * Radios versus Select: radios show every option at once and cost vertical
 * space, so they are right up to about five options and for choices the user
 * should compare. Past that, Select (DESIGN.md §8).
 */
import { RadioGroup } from '@vaadin/react-components/RadioGroup.js';
import { RadioButton } from '@vaadin/react-components/RadioButton.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const OneValue = () => (
  <RadioGroup label="Payment method" value="card">
    <RadioButton value="card" label="Company card" />
    <RadioButton value="cash" label="Cash" />
    <RadioButton value="own" label="Own card" />
  </RadioGroup>
);

export const Vertical = () => (
  <RadioGroup label="Reimburse to" theme="vertical" value="salary" helperText="Paid with the next payroll run">
    <RadioButton value="salary" label="Salary account" />
    <RadioButton value="iban" label="Another account" />
    <RadioButton value="none" label="Do not reimburse" />
  </RadioGroup>
);

export const States = () => (
  <div style={column}>
    <RadioGroup label="Payment method" required invalid errorMessage="Choose a payment method" theme="vertical">
      <RadioButton value="card" label="Company card" />
      <RadioButton value="cash" label="Cash" />
    </RadioGroup>
    <RadioGroup label="Payment method" value="card" theme="vertical" helperText="Cash needs a receipt photo">
      <RadioButton value="card" label="Company card" />
      <RadioButton value="cash" label="Cash" disabled />
    </RadioGroup>
    <RadioGroup label="Payment method" value="card" theme="vertical" disabled>
      <RadioButton value="card" label="Company card" />
      <RadioButton value="cash" label="Cash" />
    </RadioGroup>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['OneValue', 'Vertical', 'States'];
