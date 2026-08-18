/**
 * VerticalLayout — a column, with the same theme vocabulary as its horizontal
 * counterpart: `spacing`, `spacing-xs…xl`, `padding`, and the density steps.
 *
 * The reason it exists rather than a `<div>` is the same: Aura's spacing scale
 * and inherited density. Note that Aura's layout components already consume
 * `--vaadin-padding-l` for their own padding when you ask for `theme="padding"`,
 * so adding your own on top double-pads (DESIGN.md §4).
 *
 * `alignItems: 'stretch'` is the default and is almost always what you want in a
 * column — fields that stretch to the column width line up; fields with widths
 * of their own do not.
 */
import { VerticalLayout } from '@vaadin/react-components/VerticalLayout.js';
import { TextField } from '@vaadin/react-components/TextField.js';
import { Button } from '@vaadin/react-components/Button.js';

const box = {
  padding: 'var(--vaadin-padding-s)',
  background: 'var(--aura-accent-surface)',
  borderRadius: 'var(--vaadin-radius-s)',
};

export const Stacking = () => (
  <VerticalLayout theme="spacing">
    <div style={box}>first</div>
    <div style={box}>second</div>
    <div style={box}>third</div>
  </VerticalLayout>
);

export const Padded = () => (
  <VerticalLayout theme="spacing padding" style={{ background: 'var(--vaadin-background-container)', borderRadius: 'var(--vaadin-radius-m)' }}>
    <strong>Reimbursement</strong>
    <span style={{ color: 'var(--vaadin-text-color-secondary)' }}>Paid with the next payroll run</span>
    <Button theme="primary">Submit</Button>
  </VerticalLayout>
);

/** Stretch, the default: the fields agree about width without being told. */
export const Stretched = () => (
  <VerticalLayout theme="spacing">
    <TextField label="Merchant" />
    <TextField label="Cost centre" />
    <Button theme="primary">Save</Button>
  </VerticalLayout>
);

/** Centred instead, for an empty state — the one case widths should not stretch. */
export const Centred = () => (
  <VerticalLayout theme="spacing padding" style={{ alignItems: 'center', textAlign: 'center' }}>
    <strong>No expenses yet</strong>
    <span style={{ color: 'var(--vaadin-text-color-secondary)' }}>Anything you submit will show up here.</span>
    <Button theme="primary">Add the first one</Button>
  </VerticalLayout>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Stacking', 'Padded', 'Stretched', 'Centred'];
