/**
 * HorizontalLayout — a row.
 *
 * Worth using over a flex `<div>` for two reasons: `theme="spacing"` and
 * `theme="padding"` take their values from Aura's scale, so a row's rhythm moves
 * with `aura.base.size` instead of being frozen in your stylesheet; and `theme`
 * is a real property here, so a density variant set on the row is inherited by
 * every control in it (DESIGN.md §5).
 *
 * Use `gap` on the layout, never margins on the children — a margin belongs to
 * the child and stops working the moment the child is reused (DESIGN.md §4).
 *
 * The spacing steps are `spacing-xs` through `spacing-xl`, with plain `spacing`
 * meaning the medium step.
 */
import { HorizontalLayout } from '@vaadin/react-components/HorizontalLayout.js';
import { Button } from '@vaadin/react-components/Button.js';
import { TextField } from '@vaadin/react-components/TextField.js';

const box = {
  padding: 'var(--vaadin-padding-s)',
  background: 'var(--aura-accent-surface)',
  borderRadius: 'var(--vaadin-radius-s)',
};

export const SpacingSteps = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--vaadin-gap-m)' }}>
    {(['spacing-xs', 'spacing-s', 'spacing', 'spacing-l'] as const).map((theme) => (
      <HorizontalLayout key={theme} theme={theme}>
        <div style={box}>{theme}</div>
        <div style={box}>second</div>
        <div style={box}>third</div>
      </HorizontalLayout>
    ))}
  </div>
);

/** Alignment across the row: `alignItems` on the element, not per child. */
export const Alignment = () => (
  <HorizontalLayout theme="spacing padding" style={{ alignItems: 'baseline' }}>
    <TextField label="Merchant" value="Stockmann" />
    <TextField label="Amount" value="82.50" />
    <Button theme="primary">Add</Button>
  </HorizontalLayout>
);

/**
 * One child takes the slack. `flex: 1` on the child that should grow beats
 * fixed widths on the ones that should not.
 */
export const Expanding = () => (
  <HorizontalLayout theme="spacing">
    <TextField placeholder="Search expenses" style={{ flex: 1 }} />
    <Button>Filter</Button>
    <Button theme="primary">New</Button>
  </HorizontalLayout>
);

/** Density set once on the row, inherited by everything in it. */
export const Density = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--vaadin-gap-m)' }}>
    <HorizontalLayout theme="spacing small">
      <TextField label="Small row" value="theme=small" />
      <Button>Add</Button>
    </HorizontalLayout>
    <HorizontalLayout theme="spacing large">
      <TextField label="Large row" value="theme=large" />
      <Button>Add</Button>
    </HorizontalLayout>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['SpacingSteps', 'Alignment', 'Expanding', 'Density'];
