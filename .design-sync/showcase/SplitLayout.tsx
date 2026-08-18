/**
 * SplitLayout — two panes and a splitter the user can drag.
 *
 * Exactly **two children**: a third is not a third pane, it is a bug. Nest a
 * second SplitLayout when you need three.
 *
 * The initial proportion is set on the children, not on the layout — a `width`
 * (or `height`, when vertical) on the first child, and `flex: 1` on the second
 * so it takes the remainder. The layout needs a height of its own; without one
 * it collapses and the splitter has nothing to drag.
 *
 * For a list-and-detail screen, prefer MasterDetailLayout: it does the same
 * split and also knows how to stack on a narrow viewport, which a SplitLayout
 * never will.
 */
import { SplitLayout } from '@vaadin/react-components/SplitLayout.js';
import { ListBox } from '@vaadin/react-components/ListBox.js';
import { Item } from '@vaadin/react-components/Item.js';

const pane = { padding: 'var(--vaadin-padding-m)', overflow: 'auto' };

export const Horizontal = () => (
  <SplitLayout style={{ height: '260px', border: '1px solid var(--vaadin-border-color-secondary)', borderRadius: 'var(--vaadin-radius-m)' }}>
    <div style={{ ...pane, width: '30%' }}>
      <ListBox selected={0}>
        <Item>Awaiting approval</Item>
        <Item>Approved</Item>
        <Item>Rejected</Item>
      </ListBox>
    </div>
    <div style={{ ...pane, flex: 1 }}>
      <strong>Awaiting approval</strong>
      <p style={{ color: 'var(--vaadin-text-color-secondary)' }}>Drag the splitter to resize.</p>
    </div>
  </SplitLayout>
);

export const Vertical = () => (
  <SplitLayout
    orientation="vertical"
    style={{ height: '260px', border: '1px solid var(--vaadin-border-color-secondary)', borderRadius: 'var(--vaadin-radius-m)' }}
  >
    <div style={{ ...pane, height: '40%' }}>
      <strong>Expenses</strong>
    </div>
    <div style={{ ...pane, flex: 1 }}>
      <strong>Receipt preview</strong>
    </div>
  </SplitLayout>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Horizontal', 'Vertical'];
