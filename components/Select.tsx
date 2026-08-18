/**
 * Select — a short fixed set of options.
 *
 * Verified against @vaadin/react-components@25.2.8.
 *
 * Select vs ComboBox (DESIGN.md §8): Select when the options are few, fixed and
 * not worth typing to find; ComboBox when the set is long or filterable. A
 * Select with two hundred options is a scroll marathon; a ComboBox over three
 * options makes the user type to reach what a click would have shown.
 *
 * Unlike ComboBox, Select is **not generic** and has no `selectedItem`: options
 * are `SelectItem` records (`{ label, value }`) and the value is their string
 * `value`. If you need to bind an object, map back from the value yourself.
 */
import { useState } from 'react';
import { Select, type SelectItem } from '@vaadin/react-components/Select.js';
import { Item } from '@vaadin/react-components/Item.js';
import { ListBox } from '@vaadin/react-components/ListBox.js';

const sortOptions: SelectItem[] = [
  { label: 'Most recent first', value: 'recent' },
  // A separator is an item with a `component` tag name and no value — not a
  // stray <hr> child.
  { component: 'hr' },
  { label: 'Amount: low to high', value: 'amount-asc' },
  { label: 'Amount: high to low', value: 'amount-desc' },
];

export function SortSelect() {
  const [sort, setSort] = useState('recent');

  return (
    <Select
      label="Sort by"
      items={sortOptions}
      value={sort}
      // Same CustomEvent shape as every other Vaadin field: `detail.value`.
      onValueChanged={(event) => setSort(event.detail.value)}
    />
  );
}

/**
 * The `items` array covers plain options. For options that need markup — an
 * icon, a description line — pass `<ListBox>` children instead. Each `<Item>`
 * carries the string `value`; without one, Select falls back to the item's text
 * content, which breaks the moment the label is translated.
 */
export function StatusSelect() {
  const [status, setStatus] = useState('pending');

  return (
    <Select
      label="Status"
      value={status}
      onValueChanged={(event) => setStatus(event.detail.value)}
    >
      <ListBox>
        <Item value="pending">
          <span>Pending</span>
          <div style={{ color: 'var(--vaadin-text-color-secondary)', fontSize: 'var(--aura-font-size-s)', lineHeight: 'var(--aura-line-height-s)' }}>
            Waiting for a reviewer
          </div>
        </Item>
        <Item value="approved">
          <span>Approved</span>
          <div style={{ color: 'var(--vaadin-text-color-secondary)', fontSize: 'var(--aura-font-size-s)', lineHeight: 'var(--aura-line-height-s)' }}>
            Scheduled for payout
          </div>
        </Item>
      </ListBox>
    </Select>
  );
}

/**
 * Two things Select does that hand-rolled dropdowns forget: it has no empty
 * state of its own, so `placeholder` is what the user sees before choosing, and
 * `required` participates in form validation like any other field.
 */
export function RequiredSelect() {
  const [category, setCategory] = useState('');

  return (
    <Select
      label="Category"
      placeholder="Choose a category"
      items={[
        { label: 'Travel', value: 'travel' },
        { label: 'Meals', value: 'meals' },
        { label: 'Software', value: 'software' },
      ]}
      value={category}
      onValueChanged={(event) => setCategory(event.detail.value)}
      required
      errorMessage="A category is required for reimbursement"
    />
  );
}
