/**
 * RangeSlider — two handles, one value.
 *
 * `value` is a **`number[]`** of `[start, end]`, which is what makes this one
 * field rather than a "from" and a "to" that can cross over each other. The
 * component keeps the handles ordered; two NumberFields cannot.
 *
 * Each handle needs its own accessible name — `accessibleNameStart` and
 * `accessibleNameEnd` — or a screen reader announces two identical sliders
 * (DESIGN.md §7).
 */
import { RangeSlider } from '@vaadin/react-components/RangeSlider.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-l)' };

export const Tuple = () => (
  <div style={column}>
    <RangeSlider
      accessibleNameStart="Minimum amount"
      accessibleNameEnd="Maximum amount"
      value={[20, 80]}
      minMaxVisible
      valueAlwaysVisible
    />
    <RangeSlider accessibleNameStart="From" accessibleNameEnd="To" value={[30, 60]} />
  </div>
);

export const Stepped = () => (
  <div style={column}>
    <RangeSlider
      accessibleNameStart="Cheapest"
      accessibleNameEnd="Dearest"
      value={[100, 400]}
      min={0}
      max={500}
      step={50}
      minMaxVisible
      valueAlwaysVisible
    />
  </div>
);

export const States = () => (
  <div style={column}>
    <RangeSlider accessibleNameStart="From" accessibleNameEnd="To" value={[20, 80]} readonly minMaxVisible />
    <RangeSlider accessibleNameStart="From" accessibleNameEnd="To" value={[20, 80]} disabled minMaxVisible />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Tuple', 'Stepped', 'States'];
