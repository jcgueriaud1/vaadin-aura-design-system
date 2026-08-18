/**
 * IntegerField — whole numbers only.
 *
 * Not NumberField with `step={1}`: this one rejects a decimal outright rather
 * than rounding it, so "2.5 attendees" never reaches your model. Use it for
 * counts, quantities and anything that would be an `int` on the server.
 *
 * The value is still a string on the element. `min`/`max` are the constraint;
 * the field reports the violation itself through `invalid`.
 */
import { IntegerField } from '@vaadin/react-components/IntegerField.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const States = () => (
  <div style={column}>
    <IntegerField label="Attendees" value="4" stepButtonsVisible min={1} max={20} />
    <IntegerField label="Attendees" required helperText="Including yourself" />
    <IntegerField label="Attendees" value="0" invalid errorMessage="At least one attendee" min={1} />
  </div>
);

export const NotEditable = () => (
  <div style={column}>
    <IntegerField label="Receipts attached" value="3" readonly />
    <IntegerField label="Receipts attached" value="3" disabled />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['States', 'NotEditable'];
