/**
 * TimePicker — a time of day, as `HH:mm` (or `HH:mm:ss` once `step` is finer
 * than a minute).
 *
 * `step` is in **seconds** and it is what generates the dropdown: `step={1800}`
 * offers every half hour, and a step under 60 switches the value to include
 * seconds. It is not a spinner increment.
 *
 * The dropdown is a convenience, not the constraint — the user can always type,
 * so `min`/`max` are what actually bound the value.
 */
import { TimePicker } from '@vaadin/react-components/TimePicker.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const Steps = () => (
  <div style={column}>
    <TimePicker label="Start" value="09:00" helperText="Default step: one hour" />
    <TimePicker label="Start" value="09:30" step={1800} helperText="step=1800 — every half hour" />
    <TimePicker label="Duration" value="00:15:30" step={30} helperText="step under 60 adds seconds" />
  </div>
);

export const Bounded = () => (
  <div style={column}>
    <TimePicker label="Meeting" value="13:00" min="08:00" max="17:00" helperText="Office hours" />
    <TimePicker label="Meeting" value="21:00" min="08:00" max="17:00" invalid errorMessage="Outside office hours" />
  </div>
);

export const States = () => (
  <div style={column}>
    <TimePicker label="Start" value="09:00" readonly />
    <TimePicker label="Start" value="09:00" disabled />
    <TimePicker label="Start" required invalid errorMessage="A start time is required" clearButtonVisible />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Steps', 'Bounded', 'States'];
