/**
 * Checkbox — one boolean.
 *
 * `label` is a prop; the checkbox renders and associates it. A bare checkbox
 * with text beside it has no programmatic label and no click target on the text
 * (DESIGN.md §7).
 *
 * `indeterminate` is a third *visual* state, not a third value: it means "some
 * of the things below are checked", so it belongs on a parent of other
 * checkboxes and is cleared by the next click.
 *
 * For more than one related boolean, use CheckboxGroup — it owns the group
 * label, the array value and the shared error message.
 */
import { Checkbox } from '@vaadin/react-components/Checkbox.js';
import { useState } from 'react';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-s)' };

export const States = () => (
  <div style={column}>
    <Checkbox label="Billable to client" />
    <Checkbox label="Billable to client" checked />
    <Checkbox label="Billable to client" checked disabled />
    <Checkbox label="Billable to client" disabled />
  </div>
);

/** A parent whose state summarises its children. */
export const Indeterminate = () => {
  const [items, setItems] = useState([true, false, false]);
  const checked = items.every(Boolean);

  return (
    <div style={column}>
      <Checkbox
        label="All categories"
        checked={checked}
        indeterminate={items.some(Boolean) && !checked}
        onCheckedChanged={(event) => setItems(items.map(() => event.detail.value))}
      />
      <div style={{ ...column, paddingInlineStart: 'var(--vaadin-padding-m)' }}>
        {['Travel', 'Meals', 'Software'].map((label, index) => (
          <Checkbox
            key={label}
            label={label}
            checked={items[index]}
            onCheckedChanged={(event) =>
              setItems(items.map((value, i) => (i === index ? event.detail.value : value)))
            }
          />
        ))}
      </div>
    </div>
  );
};

/** A single checkbox can carry helper and error text like any other field. */
export const WithMessages = () => (
  <div style={column}>
    <Checkbox label="I have attached the receipt" helperText="Required for amounts over 25 €" />
    <Checkbox label="I have attached the receipt" required invalid errorMessage="Confirm the receipt is attached" />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['States', 'Indeterminate', 'WithMessages'];
