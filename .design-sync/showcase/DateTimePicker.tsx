/**
 * DateTimePicker — two inputs, one value, one validation.
 *
 * The value is a single ISO string, `yyyy-mm-ddTHH:mm`. Composing a DatePicker
 * and a TimePicker by hand gets you two fields that can each be valid while the
 * pair is not, and two error messages arguing about it; this component keeps
 * `required`, `min`, `max` and `invalid` on the pair.
 *
 * Both halves need their own placeholder — `datePlaceholder` and
 * `timePlaceholder` — because the label sits above the pair, not above each input.
 */
import { DateTimePicker } from '@vaadin/react-components/DateTimePicker.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const OneValue = () => (
  <div style={column}>
    <DateTimePicker label="Submitted at" datePlaceholder="yyyy-mm-dd" timePlaceholder="hh:mm" />
    <DateTimePicker label="Submitted at" value="2026-08-18T09:30" helperText="One ISO value: 2026-08-18T09:30" />
  </div>
);

export const Bounded = () => (
  <div style={column}>
    <DateTimePicker label="Submitted at" value="2026-08-18T09:30" step={1800} min="2026-08-01T08:00" max="2026-08-31T17:00" />
    <DateTimePicker label="Submitted at" value="2026-09-02T22:00" max="2026-08-31T17:00" invalid errorMessage="After the period closed" />
  </div>
);

export const States = () => (
  <div style={column}>
    <DateTimePicker label="Submitted at" value="2026-08-18T09:30" readonly />
    <DateTimePicker label="Submitted at" value="2026-08-18T09:30" disabled />
    <DateTimePicker label="Submitted at" required invalid errorMessage="A date and time are required" />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['OneValue', 'Bounded', 'States'];
