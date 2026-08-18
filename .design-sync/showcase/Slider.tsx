/**
 * Slider — a number chosen by position rather than typed.
 *
 * Right when the *relative* size of the value is the point (a threshold, a
 * weighting, a zoom) and the exact figure is secondary. When the figure matters,
 * use NumberField: a slider cannot be typed into, pasted into, or read out
 * precisely.
 *
 * `value` is a real `number` here, not the string the text fields use.
 * `minMaxVisible` labels the ends, `valueAlwaysVisible` pins the bubble open
 * instead of showing it only while dragging — worth it whenever the number is
 * the thing being decided.
 */
import { Slider } from '@vaadin/react-components/Slider.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-l)' };

export const Basics = () => (
  <div style={column}>
    <Slider accessibleName="Approval threshold" value={40} />
    <Slider accessibleName="Approval threshold" value={40} minMaxVisible />
    <Slider accessibleName="Approval threshold" value={40} valueAlwaysVisible minMaxVisible />
  </div>
);

export const Stepped = () => (
  <div style={column}>
    <Slider accessibleName="Attendees" value={4} min={1} max={10} step={1} minMaxVisible valueAlwaysVisible />
    <Slider accessibleName="VAT rate" value={25.5} min={0} max={30} step={0.5} minMaxVisible valueAlwaysVisible />
  </div>
);

export const States = () => (
  <div style={column}>
    <Slider accessibleName="Threshold" value={60} readonly minMaxVisible />
    <Slider accessibleName="Threshold" value={60} disabled minMaxVisible />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Basics', 'Stepped', 'States'];
