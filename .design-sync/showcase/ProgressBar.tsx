/**
 * ProgressBar — how far along something is.
 *
 * `value` is between `min` and `max` (0 and 1 by default), so a percentage goes
 * in as `0.62`, not `62`. `indeterminate` is for work whose size you genuinely
 * do not know — a request in flight — and is not a nicer-looking default: a bar
 * that never fills tells the user nothing about whether to wait.
 *
 * The bar is decorative to a screen reader on its own. Pair it with text that
 * says the same thing, and give it an accessible name (DESIGN.md §7).
 */
import { ProgressBar } from '@vaadin/react-components/ProgressBar.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-l)' };
const label = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--aura-font-size-s)',
  lineHeight: 'var(--aura-line-height-s)',
  color: 'var(--vaadin-text-color-secondary)',
};

export const Determinate = () => (
  <div style={column}>
    <div>
      <div style={label}>
        <span>Uploading receipts</span>
        <span>62%</span>
      </div>
      <ProgressBar value={0.62} aria-label="Uploading receipts" />
    </div>
    <div>
      <div style={label}>
        <span>Month-end close</span>
        <span>4 of 12 steps</span>
      </div>
      <ProgressBar value={4} min={0} max={12} aria-label="Month-end close" />
    </div>
  </div>
);

/** Unknown duration — and text that says what is happening. */
export const Indeterminate = () => (
  <div style={column}>
    <div>
      <div style={label}>
        <span>Contacting the payment provider…</span>
      </div>
      <ProgressBar indeterminate aria-label="Contacting the payment provider" />
    </div>
  </div>
);

/** The state themes, each with words that carry the same meaning. */
export const Themes = () => (
  <div style={column}>
    <div>
      <div style={label}>
        <span>Submitted</span>
      </div>
      <ProgressBar value={1} theme="success" aria-label="Submitted" />
    </div>
    <div>
      <div style={label}>
        <span>Failed at receipt 3 of 8</span>
      </div>
      <ProgressBar value={0.375} theme="error" aria-label="Failed at receipt 3 of 8" />
    </div>
    <div>
      <div style={label}>
        <span>Budget used</span>
        <span>92%</span>
      </div>
      <ProgressBar value={0.92} theme="contrast" aria-label="Budget used" />
    </div>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Determinate', 'Indeterminate', 'Themes'];
