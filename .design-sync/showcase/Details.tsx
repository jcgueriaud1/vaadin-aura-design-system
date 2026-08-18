/**
 * Details — one disclosure: a summary the user can expand.
 *
 * `summary` takes a string; DetailsSummary as a slotted child is for a summary
 * that is not just text — a row with a Badge, a count, an icon. Use one or the
 * other, never both.
 *
 * Content inside a closed Details is in the DOM but hidden, so do not hide
 * anything required in one: a form that fails validation on a field the user
 * cannot see is a dead end. Aura's own themes are `filled`, `reverse` and the
 * size steps.
 */
import { Details } from '@vaadin/react-components/Details.js';
import { DetailsSummary } from '@vaadin/react-components/DetailsSummary.js';
import { Badge } from '@vaadin/react-components/Badge.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const Disclosure = () => (
  <div style={column}>
    <Details summary="Receipt details">
      <p style={{ margin: 0 }}>Taxi from Helsinki-Vantaa to the office, 18 August.</p>
    </Details>
    <Details summary="Receipt details" opened>
      <p style={{ margin: 0 }}>Opened by default, for the panel the user came here for.</p>
    </Details>
  </div>
);

/** A summary that is more than text — DetailsSummary as a slotted child. */
export const RichSummary = () => (
  <Details opened>
    <DetailsSummary slot="summary">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vaadin-gap-s)' }}>
        Validation problems <Badge theme="error">2</Badge>
      </span>
    </DetailsSummary>
    <ul style={{ margin: 0, paddingInlineStart: 'var(--vaadin-padding-l)' }}>
      <li>Receipt is missing</li>
      <li>Cost centre is not recognised</li>
    </ul>
  </Details>
);

export const Themes = () => (
  <div style={column}>
    <Details summary="Filled" theme="filled" opened>
      <span>theme="filled" — reads as a panel rather than a line.</span>
    </Details>
    <Details summary="Reverse" theme="reverse" opened>
      <span>theme="reverse" — the toggle sits after the summary.</span>
    </Details>
    <Details summary="Small" theme="small" opened>
      <span>theme="small" — the density steps apply here too.</span>
    </Details>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Disclosure', 'RichSummary', 'Themes'];
