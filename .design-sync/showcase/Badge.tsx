/**
 * Badge — a small piece of state next to the thing it describes.
 *
 * Its colour is the **accent**, re-pointed: `theme="success"` moves
 * `--aura-accent-color` for that badge and the text, surface and border follow.
 * Which is why you never assign a badge a background (DESIGN.md §6).
 *
 * Only four states have a `theme`: `success` → green, `warning` → yellow,
 * `error` (and `danger`) → red, `info` → blue. Orange and purple exist as hues
 * but have no theme variant — reach for `.aura-accent-orange` /
 * `.aura-accent-purple` when a domain needs a fifth and sixth colour.
 *
 * `filled` is the solid form and reads louder; the default tinted form is right
 * for a badge that sits in a table of many. `dot` drops the text for a status
 * light — which then needs a label somewhere, because colour is never the only
 * signal (DESIGN.md §6).
 *
 * `number` is the counter form. Anything that is *not* state — a category, a
 * tag — is not a badge; it is text.
 */
import { Badge } from '@vaadin/react-components/Badge.js';
import { Icon } from '@vaadin/react-components/Icon.js';

const row = { display: 'flex', alignItems: 'center', gap: 'var(--vaadin-gap-s)', flexWrap: 'wrap' as const };

export const States = () => (
  <div style={row}>
    <Badge>Draft</Badge>
    <Badge theme="success">Approved</Badge>
    <Badge theme="warning">Missing receipt</Badge>
    <Badge theme="error">Rejected</Badge>
    <Badge theme="info">Submitted</Badge>
  </div>
);

export const Filled = () => (
  <div style={row}>
    <Badge theme="filled">Draft</Badge>
    <Badge theme="success filled">Approved</Badge>
    <Badge theme="warning filled">Missing receipt</Badge>
    <Badge theme="error filled">Rejected</Badge>
    <Badge theme="info filled">Submitted</Badge>
  </div>
);

/** The two hues without a theme variant, reached by class. */
export const AllSixHues = () => (
  <div style={row}>
    <Badge theme="error">red</Badge>
    <Badge className="aura-accent-orange">orange</Badge>
    <Badge theme="warning">yellow</Badge>
    <Badge theme="success">green</Badge>
    <Badge theme="info">blue</Badge>
    <Badge className="aura-accent-purple">purple</Badge>
  </div>
);

/** With an icon, and as a count. */
export const IconsAndCounts = () => (
  <div style={row}>
    <Badge theme="error">
      <Icon slot="icon" icon="vaadin:warning" />
      Over budget
    </Badge>
    <Badge theme="success">
      <Icon slot="icon" icon="vaadin:check" />
      Paid
    </Badge>
    <Badge number={12} />
    <Badge theme="error" number={2} />
    {/* A status light still needs words beside it. */}
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vaadin-gap-xs)' }}>
      <Badge theme="success dot" /> Live
    </span>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['States', 'Filled', 'AllSixHues', 'IconsAndCounts'];
