/**
 * MenuBar — a horizontal bar of buttons, each of which may open a submenu.
 *
 * The whole structure is `items` **data**, not children: a button is an item,
 * and a submenu is that item's `children`. Nesting JSX inside a MenuBar puts
 * elements in the default slot, where nothing renders them.
 *
 * Aura gives the buttons the same prominence and size axes as Button, applied
 * to the bar: `theme="primary"`, `theme="small"`, and `end-aligned` for a bar
 * that sits on the right of a toolbar.
 */
import { MenuBar } from '@vaadin/react-components/MenuBar.js';
import type { MenuBarItem } from '@vaadin/react-components/MenuBar.js';

const items: MenuBarItem[] = [
  {
    text: 'File',
    children: [{ text: 'New expense' }, { text: 'Import…' }, { component: 'hr' }, { text: 'Export CSV' }],
  },
  {
    text: 'Edit',
    children: [{ text: 'Undo' }, { text: 'Redo', disabled: true }],
  },
  { text: 'Help' },
];

export const Nested = () => <MenuBar items={items} />;

/** Prominence and size are the Button axes, set once on the bar. */
export const Prominence = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--vaadin-gap-m)' }}>
    <MenuBar theme="primary" items={items} />
    <MenuBar theme="tertiary" items={items} />
    <MenuBar theme="small" items={items} />
  </div>
);

/**
 * The bar collapses what does not fit into an overflow button by itself — which
 * is why it needs to own the width rather than be sized by its content.
 */
export const Overflow = () => (
  <div style={{ maxWidth: '18rem', minWidth: 0 }}>
    <MenuBar items={[...items, { text: 'Reports' }, { text: 'Approvals' }, { text: 'Settings' }]} />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Nested', 'Prominence', 'Overflow'];
