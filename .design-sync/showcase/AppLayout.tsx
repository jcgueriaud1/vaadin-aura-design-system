/**
 * AppLayout — the application frame: a navbar, a drawer, and the page.
 *
 * The three regions are **slots**, and the default slot is the page content, so
 * anything without a `slot` becomes the page. `primarySection` decides which of
 * the navbar and the drawer spans the full width at the top.
 *
 * The drawer is responsive on its own: at narrow widths it becomes an overlay
 * with a backdrop, which is why DrawerToggle belongs in the navbar and not in
 * your own header markup. DrawerToggle needs no wiring — it finds the layout and
 * toggles `drawerOpened` itself.
 *
 * In an application this sits at the root of the page, sized by the viewport.
 * The stories give it an explicit height because a card is not a viewport.
 */
import { AppLayout } from '@vaadin/react-components/AppLayout.js';
import { DrawerToggle } from '@vaadin/react-components/DrawerToggle.js';
import { SideNav } from '@vaadin/react-components/SideNav.js';
import { SideNavItem } from '@vaadin/react-components/SideNavItem.js';
import { Avatar } from '@vaadin/react-components/Avatar.js';
import { Icon } from '@vaadin/react-components/Icon.js';

const frame = {
  height: '420px',
  border: '1px solid var(--vaadin-border-color-secondary)',
  borderRadius: 'var(--vaadin-radius-l)',
  overflow: 'hidden',
};

const nav = (
  <SideNav slot="drawer">
    <SideNavItem path="/expenses">
      <Icon icon="vaadin:list" slot="prefix" />
      Expenses
    </SideNavItem>
    <SideNavItem path="/approvals">
      <Icon icon="vaadin:check" slot="prefix" />
      Approvals
    </SideNavItem>
    <SideNavItem path="/reports">
      <Icon icon="vaadin:chart" slot="prefix" />
      Reports
    </SideNavItem>
  </SideNav>
);

const page = (
  <div style={{ padding: 'var(--vaadin-padding-l)' }}>
    <h2 style={{ marginBlockStart: 0 }}>Expenses</h2>
    <p style={{ color: 'var(--vaadin-text-color-secondary)' }}>
      Everything without a slot is the page content.
    </p>
  </div>
);

/** The default: navbar across the top, drawer beneath it on the left. */
export const DrawerAndNavbar = () => (
  <div style={frame}>
    <AppLayout style={{ height: '100%' }}>
      <DrawerToggle slot="navbar" />
      <h3 slot="navbar" style={{ margin: 0, fontSize: 'var(--aura-font-size-m)' }}>
        Expense Manager
      </h3>
      <Avatar slot="navbar" name="Pat Kelly" theme="small" style={{ marginInlineStart: 'auto', marginInlineEnd: 'var(--vaadin-padding-m)' }} />
      {nav}
      {page}
    </AppLayout>
  </div>
);

/** `primarySection="drawer"` — the drawer spans full height, the navbar insets. */
export const DrawerPrimary = () => (
  <div style={frame}>
    <AppLayout primarySection="drawer" style={{ height: '100%' }}>
      <h3 slot="drawer" style={{ margin: 'var(--vaadin-padding-m)', fontSize: 'var(--aura-font-size-m)' }}>
        Expense Manager
      </h3>
      {nav}
      <DrawerToggle slot="navbar" />
      <span slot="navbar">Expenses</span>
      {page}
    </AppLayout>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['DrawerAndNavbar', 'DrawerPrimary'];
