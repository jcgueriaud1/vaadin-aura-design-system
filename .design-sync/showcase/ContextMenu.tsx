/**
 * ContextMenu — a menu opened by the user on a target, not a menu you place.
 *
 * The children are the **target**, and `items` is the menu. `openOn` decides
 * the gesture: the default is a right-click (`vaadin-contextmenu`, which also
 * covers long-press on touch), and `openOn="click"` turns the target into a
 * plain menu trigger.
 *
 * A right-click-only menu is unreachable by keyboard, so anything offered here
 * must also be reachable somewhere else — a MenuBar, a toolbar button
 * (DESIGN.md §7).
 */
import { ContextMenu } from '@vaadin/react-components/ContextMenu.js';
import type { ContextMenuItem } from '@vaadin/react-components/ContextMenu.js';
import { Button } from '@vaadin/react-components/Button.js';

const items: ContextMenuItem[] = [
  { text: 'Open' },
  { text: 'Duplicate' },
  { component: 'hr' },
  { text: 'Move to', children: [{ text: 'Q1' }, { text: 'Q2' }, { text: 'Q3' }] },
  { text: 'Delete', disabled: true },
];

/** The default gesture. The target is styled to say it has a menu. */
export const RightClick = () => (
  <ContextMenu items={items}>
    <div
      style={{
        padding: 'var(--vaadin-padding-m)',
        border: '1px dashed var(--vaadin-border-color)',
        borderRadius: 'var(--vaadin-radius-m)',
        color: 'var(--vaadin-text-color-secondary)',
      }}
    >
      Right-click this row
    </div>
  </ContextMenu>
);

/** `openOn="click"` — a menu button, and the keyboard-reachable form. */
export const OnClick = () => (
  <ContextMenu openOn="click" items={items}>
    <Button theme="tertiary">Actions</Button>
  </ContextMenu>
);

/** `checked` marks state; a separator is an item whose `component` is an `hr`. */
export const Checked = () => (
  <ContextMenu
    openOn="click"
    items={[
      { text: 'Group by merchant', checked: true },
      { text: 'Group by month' },
      { component: 'hr' },
      { text: 'Show archived' },
    ]}
  >
    <Button theme="tertiary">View</Button>
  </ContextMenu>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['RightClick', 'OnClick', 'Checked'];
