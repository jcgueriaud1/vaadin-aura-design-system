/**
 * CustomField — several inputs that are one value.
 *
 * It supplies the label, the helper text, the error message, the required
 * indicator and the validation lifecycle, and joins its children's values with a
 * tab into its own `value`. That is the whole reason to reach for it: a `<div>`
 * of two fields has two labels, two error messages and no single thing to
 * validate or mark required.
 *
 * Override `parseValue`/`formatValue` on the element when the joined string is
 * not the shape you want to store; a ref is the honest way to reach them, since
 * they are methods rather than props.
 *
 * It has **no `disabled`** — deliberately. The wrapper owns the label and the
 * validation, not the inputs, so disabling is something you do to the children.
 * There is no `readonly` either, for the same reason.
 */
import { CustomField } from '@vaadin/react-components/CustomField.js';
import { TextField } from '@vaadin/react-components/TextField.js';
import { NumberField } from '@vaadin/react-components/NumberField.js';
import { Select } from '@vaadin/react-components/Select.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

/** One money value: amount plus currency, labelled and validated once. */
export const Composed = () => (
  <CustomField label="Amount" helperText="Amount and currency are one value">
    <NumberField value="128.40" />
    <Select
      value="EUR"
      items={[
        { label: 'EUR', value: 'EUR' },
        { label: 'USD', value: 'USD' },
        { label: 'SEK', value: 'SEK' },
      ]}
    />
  </CustomField>
);

/** An IBAN in the blocks people read it in — still one field to the form. */
export const Blocks = () => (
  <CustomField label="Account number" required>
    <TextField value="FI21" />
    <TextField value="1234" />
    <TextField value="5600" />
    <TextField value="000785" />
  </CustomField>
);

export const States = () => (
  <div style={column}>
    <CustomField label="Amount" required invalid errorMessage="An amount and a currency are both required">
      <NumberField />
      <Select items={[{ label: 'EUR', value: 'EUR' }]} />
    </CustomField>
    {/* Disabled belongs on the children — see the note above. */}
    <CustomField label="Amount" helperText="Set once the expense is approved">
      <NumberField value="128.40" disabled />
      <Select value="EUR" items={[{ label: 'EUR', value: 'EUR' }]} disabled />
    </CustomField>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Composed', 'Blocks', 'States'];
