/**
 * Tabs — a row of tabs and nothing else.
 *
 * Tabs owns only the selection; it does not own any panels. That makes it the
 * right component when the tabs are **navigation** and a router decides what is
 * below. When the tabs switch content on the same page, use TabSheet — it pairs
 * each tab with its panel by id and saves you the wiring.
 *
 * `selected` is an index, so the tab order and your content order have to agree —
 * one reason TabSheet's id-based pairing is safer for anything that will grow.
 *
 * The row scrolls when it overflows and grows its own arrows; do not wrap it in
 * your own scroller. `orientation="vertical"` is the drawer form, which is what
 * AppLayout's drawer expects.
 */
import { useState } from 'react';
import { Tabs } from '@vaadin/react-components/Tabs.js';
import { Tab } from '@vaadin/react-components/Tab.js';
import { Icon } from '@vaadin/react-components/Icon.js';
import { Badge } from '@vaadin/react-components/Badge.js';

const panels = ['Everything submitted this month.', 'Waiting on Ada Nkemelu.', 'Two rejections to fix.'];

/** Selection is yours; the content below is yours too. */
export const Selection = () => {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <Tabs selected={selected} onSelectedChanged={(event) => setSelected(event.detail.value)}>
        <Tab>All</Tab>
        <Tab>Awaiting approval</Tab>
        <Tab>Rejected</Tab>
      </Tabs>
      <p style={{ color: 'var(--vaadin-text-color-secondary)' }}>{panels[selected]}</p>
    </div>
  );
};

/** Icons and counts inside a tab — both are slotted children. */
export const WithContent = () => (
  <Tabs selected={1}>
    <Tab>
      <Icon icon="vaadin:list" slot="prefix" />
      All
    </Tab>
    <Tab>
      <Icon icon="vaadin:clock" slot="prefix" />
      Awaiting <Badge>12</Badge>
    </Tab>
    <Tab>
      Rejected <Badge theme="error">2</Badge>
    </Tab>
    <Tab disabled>Archived</Tab>
  </Tabs>
);

/** Vertical, the drawer form. */
export const Vertical = () => (
  <Tabs orientation="vertical" selected={0} style={{ maxWidth: '16rem' }}>
    <Tab>Expenses</Tab>
    <Tab>Approvals</Tab>
    <Tab>Reports</Tab>
  </Tabs>
);

/** Overflow: the row scrolls itself rather than wrapping. */
export const Overflow = () => (
  <div style={{ maxWidth: '22rem' }}>
    <Tabs selected={0}>
      {['All', 'Awaiting', 'Approved', 'Rejected', 'Archived', 'Drafts', 'Exported'].map((label) => (
        <Tab key={label}>{label}</Tab>
      ))}
    </Tabs>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Selection', 'WithContent', 'Vertical', 'Overflow'];
