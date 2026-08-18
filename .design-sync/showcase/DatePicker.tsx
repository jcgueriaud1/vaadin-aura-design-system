/**
 * DatePicker — one calendar date.
 *
 * `value` is always **ISO 8601** (`yyyy-mm-dd`), whatever the user sees in the
 * input. That split is the point: you store and compare ISO, and `i18n`
 * decides how it is displayed and parsed. Never parse the visible text
 * yourself, and never store the formatted string.
 *
 * `min` and `max` are ISO too, and the component both disables the out-of-range
 * days in the overlay and reports the violation through `invalid`.
 */
import { DatePicker } from '@vaadin/react-components/DatePicker.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const IsoValue = () => (
  <div style={column}>
    <DatePicker label="Expense date" placeholder="yyyy-mm-dd" />
    <DatePicker label="Expense date" value="2026-08-18" helperText="Stored as 2026-08-18" />
  </div>
);

export const Bounded = () => (
  <div style={column}>
    <DatePicker label="Expense date" value="2026-08-18" min="2026-08-01" max="2026-08-31" helperText="This period only" />
    <DatePicker label="Expense date" value="2026-07-04" min="2026-08-01" invalid errorMessage="Outside the open period" />
  </div>
);

/**
 * `i18n` is where the display format lives. Supplying `formatDate` without
 * `parseDate` gives you a field that shows one format and refuses to read it
 * back, so they always travel together.
 */
export const Localised = () => (
  <DatePicker
    label="Expense date"
    value="2026-08-18"
    i18n={{
      formatDate: (date) => `${date.day}.${date.month + 1}.${date.year}`,
      parseDate: (text) => {
        const [day, month, year] = text.split('.').map(Number);
        return day && month && year ? { day, month: month - 1, year } : undefined;
      },
      firstDayOfWeek: 1,
    }}
    helperText="Finnish d.m.yyyy, still stored as ISO"
  />
);

export const States = () => (
  <div style={column}>
    <DatePicker label="Expense date" value="2026-08-18" readonly />
    <DatePicker label="Expense date" value="2026-08-18" disabled />
    <DatePicker label="Expense date" required invalid errorMessage="A date is required" clearButtonVisible />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['IsoValue', 'Bounded', 'Localised', 'States'];
