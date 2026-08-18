/**
 * Breadcrumbs — where the current page sits in the hierarchy.
 *
 * The last item is the current page, and it gets **no `path`**: a link to the
 * page you are already on is noise, and the component styles the pathless last
 * item as the current one. Giving every item a path is the usual mistake.
 *
 * The trail is the site's structure, not the user's history — it does not change
 * because they arrived sideways. For "how did I get here", that is the back
 * button, and it already exists.
 *
 * Items collapse behind an overflow button when the trail is too long for its
 * container, so the first and last stay visible.
 */
import { Breadcrumbs } from '@vaadin/react-components/Breadcrumbs.js';
import { BreadcrumbsItem } from '@vaadin/react-components/BreadcrumbsItem.js';

export const Trail = () => (
  <Breadcrumbs>
    <BreadcrumbsItem path="/">Home</BreadcrumbsItem>
    <BreadcrumbsItem path="/expenses">Expenses</BreadcrumbsItem>
    <BreadcrumbsItem path="/expenses/2026-08">August 2026</BreadcrumbsItem>
    <BreadcrumbsItem>EXP-2291</BreadcrumbsItem>
  </Breadcrumbs>
);

export const TwoLevels = () => (
  <Breadcrumbs>
    <BreadcrumbsItem path="/">Home</BreadcrumbsItem>
    <BreadcrumbsItem>Expenses</BreadcrumbsItem>
  </Breadcrumbs>
);

/** Narrow container: the middle collapses rather than wrapping. */
export const Overflow = () => (
  <div style={{ maxWidth: '20rem' }}>
    <Breadcrumbs>
      <BreadcrumbsItem path="/">Home</BreadcrumbsItem>
      <BreadcrumbsItem path="/organisation">Organisation</BreadcrumbsItem>
      <BreadcrumbsItem path="/organisation/finland">Finland</BreadcrumbsItem>
      <BreadcrumbsItem path="/organisation/finland/engineering">Engineering</BreadcrumbsItem>
      <BreadcrumbsItem>Design System</BreadcrumbsItem>
    </Breadcrumbs>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Trail', 'TwoLevels', 'Overflow'];
