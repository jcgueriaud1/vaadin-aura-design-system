/**
 * ListBox — a flat list the user picks from, in place.
 *
 * Not a form field: it has no label, no validation and no `value`. It is the
 * list *inside* Select and ContextMenu, and on its own it is right for a pane
 * that is itself the choice — a sidebar of views, a picker in a popover.
 *
 * Selection is by **index**: `selected` for single, `selectedValues` (indices,
 * despite the name) with `multiple`. If you need a value rather than a position,
 * you want Select or ComboBox.
 *
 * Item is the row. A separator is a plain `<hr>` between items, which the list
 * skips when arrowing through.
 */
import { ListBox } from '@vaadin/react-components/ListBox.js';
import { Item } from '@vaadin/react-components/Item.js';
import { Icon } from '@vaadin/react-components/Icon.js';

export const SingleSelection = () => (
  <ListBox selected={1}>
    <Item>All expenses</Item>
    <Item>Awaiting approval</Item>
    <Item>Approved</Item>
    <hr />
    <Item>Archived</Item>
  </ListBox>
);

export const MultipleSelection = () => (
  <ListBox multiple selectedValues={[0, 2]}>
    <Item>Travel</Item>
    <Item>Meals</Item>
    <Item>Software</Item>
    <Item>Hardware</Item>
  </ListBox>
);

export const WithIcons = () => (
  <ListBox selected={0}>
    <Item>
      <Icon icon="vaadin:list" slot="prefix" /> All expenses
    </Item>
    <Item>
      <Icon icon="vaadin:clock" slot="prefix" /> Awaiting approval
    </Item>
    <Item disabled>
      <Icon icon="vaadin:archive" slot="prefix" /> Archived
    </Item>
  </ListBox>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['SingleSelection', 'MultipleSelection', 'WithIcons'];
