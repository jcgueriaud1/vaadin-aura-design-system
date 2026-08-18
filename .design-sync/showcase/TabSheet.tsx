/**
 * TabSheet — Tabs plus their panels, so you do not wire them together.
 *
 * The association is by **id**: every Tab has an `id`, and each panel is a plain
 * element with a matching `tab="<id>"` attribute. Get one wrong and that panel
 * simply never shows — there is no error.
 *
 * Reach for this over Tabs whenever the tabs switch content on the same page.
 * Use bare Tabs when the tabs are navigation (a router owns what is below) —
 * TabSheet owns its panels and a router cannot.
 *
 * A tab whose panel has no content yet puts the sheet in its `loading` state,
 * which is how lazily-loaded panels look while they arrive.
 *
 * Note how the panels are written: `{...{ tab: 'details' }}` rather than
 * `tab="details"`. A panel is a plain host element, and React only emits
 * attributes it knows — an unrecognised one on a `<div>` is a type error, and in
 * plain JS would be dropped silently, leaving a panel that never shows. Spread
 * it, exactly as `theme` has to be spread onto a host element.
 */
import { TabSheet } from '@vaadin/react-components/TabSheet.js';
import { Tabs } from '@vaadin/react-components/Tabs.js';
import { Tab } from '@vaadin/react-components/Tab.js';
import { Badge } from '@vaadin/react-components/Badge.js';
import { Button } from '@vaadin/react-components/Button.js';

export const TabsAndPanels = () => (
  <TabSheet>
    <Tabs slot="tabs">
      <Tab id="details">Details</Tab>
      <Tab id="receipts">Receipts</Tab>
      <Tab id="history">History</Tab>
    </Tabs>

    <div {...{ tab: 'details' }}>
      <p style={{ marginBlockStart: 0 }}>Finnair · 412 € · 18 August</p>
    </div>
    <div {...{ tab: 'receipts' }}>
      <p style={{ marginBlockStart: 0 }}>Two receipts attached.</p>
    </div>
    <div {...{ tab: 'history' }}>
      <p style={{ marginBlockStart: 0 }}>Submitted, then rejected, then resubmitted.</p>
    </div>
  </TabSheet>
);

/** `selected` is the tab index, and prefix/suffix slots frame the tab row. */
export const WithPrefixAndSuffix = () => (
  <TabSheet selected={1}>
    <span slot="prefix" style={{ color: 'var(--vaadin-text-color-secondary)' }}>
      EXP-2291
    </span>
    <Button slot="suffix" theme="tertiary small">
      Edit
    </Button>
    <Tabs slot="tabs">
      <Tab id="details">Details</Tab>
      <Tab id="problems">
        Problems <Badge theme="error">2</Badge>
      </Tab>
    </Tabs>

    <div {...{ tab: 'details' }}>
      <p style={{ marginBlockStart: 0 }}>Finnair · 412 €</p>
    </div>
    <div {...{ tab: 'problems' }}>
      <p style={{ marginBlockStart: 0 }}>Receipt missing; cost centre unknown.</p>
    </div>
  </TabSheet>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['TabsAndPanels', 'WithPrefixAndSuffix'];
