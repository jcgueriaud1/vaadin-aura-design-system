/**
 * SideNav — the application's navigation list, usually in AppLayout's drawer.
 *
 * Items are real links: `path` becomes an `href`, so middle-click and
 * open-in-new-tab work, and the current item is marked from the browser location
 * rather than from state you maintain. That is the reason to use this over Tabs
 * with a router — Tabs has no idea what page you are on.
 *
 * With a client-side router, intercept `navigate` on the SideNav and call your
 * router there; the item still renders as an anchor. `routerIgnore` opts a single
 * item out, for a link that must do a full page load.
 *
 * Nesting is nesting: a SideNavItem inside a SideNavItem becomes a collapsible
 * group, expanded automatically when a child matches the location. `collapsible`
 * makes the whole nav collapse under its `label`.
 */
import { SideNav } from '@vaadin/react-components/SideNav.js';
import { SideNavItem } from '@vaadin/react-components/SideNavItem.js';
import { Icon } from '@vaadin/react-components/Icon.js';
import { Badge } from '@vaadin/react-components/Badge.js';

export const Nested = () => (
  <SideNav>
    <SideNavItem path="/expenses">
      <Icon icon="vaadin:list" slot="prefix" />
      Expenses
    </SideNavItem>
    <SideNavItem path="/approvals" expanded>
      <Icon icon="vaadin:check" slot="prefix" />
      Approvals
      <SideNavItem path="/approvals/mine" slot="children">
        Mine
        <Badge slot="suffix">12</Badge>
      </SideNavItem>
      <SideNavItem path="/approvals/team" slot="children">
        My team
      </SideNavItem>
    </SideNavItem>
    <SideNavItem path="/reports">
      <Icon icon="vaadin:chart" slot="prefix" />
      Reports
    </SideNavItem>
  </SideNav>
);

/** `collapsible` plus a `label` — a section of a longer drawer. */
export const Collapsible = () => (
  <SideNav collapsible>
    <span slot="label">Administration</span>
    <SideNavItem path="/admin/users">Users</SideNavItem>
    <SideNavItem path="/admin/cost-centres">Cost centres</SideNavItem>
    <SideNavItem path="/admin/policies">Policies</SideNavItem>
  </SideNav>
);

/** An external link, opted out of the router and out of the tab-nav illusion. */
export const ExternalLink = () => (
  <SideNav>
    <SideNavItem path="/expenses">Expenses</SideNavItem>
    <SideNavItem path="https://vaadin.com/docs" target="_blank" routerIgnore>
      <Icon icon="vaadin:external-link" slot="prefix" />
      Documentation
    </SideNavItem>
  </SideNav>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Nested', 'Collapsible', 'ExternalLink'];
