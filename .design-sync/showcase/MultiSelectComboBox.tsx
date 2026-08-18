/**
 * MultiSelectComboBox — a ComboBox whose value is a set.
 *
 * The value lives in `selectedItems` (an array of items), not `value` — `value`
 * on this component is the filter text the user has typed. Binding to `value`
 * is the mistake that makes selections vanish on blur.
 *
 * Chosen items become chips, and the component collapses them into a
 * "+N" summary when the field is too narrow, so it stays one line high in a
 * FormLayout instead of pushing the form around as the user selects.
 */
import { MultiSelectComboBox } from '@vaadin/react-components/MultiSelectComboBox.js';

const categories = ['Travel', 'Meals', 'Software', 'Hardware', 'Training', 'Office'];

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const SelectedItems = () => (
  <MultiSelectComboBox label="Categories" items={categories} selectedItems={['Travel', 'Meals']} />
);

/** Narrow on purpose: this is the overflow summary the component does for you. */
export const OverflowSummary = () => (
  <div style={{ maxWidth: '16rem' }}>
    <MultiSelectComboBox
      label="Categories"
      items={categories}
      selectedItems={['Travel', 'Meals', 'Software', 'Training']}
      helperText="Chips collapse rather than wrap"
    />
  </div>
);

export const States = () => (
  <div style={column}>
    <MultiSelectComboBox label="Categories" items={categories} required invalid errorMessage="Choose at least one" />
    <MultiSelectComboBox label="Categories" items={categories} selectedItems={['Travel']} readonly />
    <MultiSelectComboBox label="Categories" items={categories} selectedItems={['Travel']} disabled />
  </div>
);

/**
 * `allowCustomValue` lets the user add something not on the list — you own
 * committing it, via `onCustomValueSet`, because only you know whether a new
 * category is allowed to exist.
 */
export const CustomValues = () => (
  <MultiSelectComboBox
    label="Tags"
    items={['q1', 'q2', 'billable']}
    selectedItems={['billable']}
    allowCustomValue
    helperText="Type a tag that does not exist yet"
  />
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['SelectedItems', 'OverflowSummary', 'States', 'CustomValues'];
