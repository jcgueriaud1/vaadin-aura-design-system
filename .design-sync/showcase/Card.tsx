/**
 * Card — a container that groups related content and its actions.
 *
 * Everything is a slot, and the slot names are the layout: `media` above (or
 * beside, with `theme="cover-media"`), `title` and `subtitle` in the header,
 * `header-prefix`/`header-suffix` for an avatar or an overflow menu, the default
 * slot for the body, and `footer` pinned to the bottom.
 *
 * `cardTitle` is the string form of the title, and it is the better one when the
 * title is text: the component generates the heading element and wires
 * `aria-labelledby` to it, which a slotted `<div slot="title">` cannot do. Use
 * `titleHeadingLevel` to fit the card into the page's heading outline rather than
 * styling a div to look like a heading (DESIGN.md §4).
 *
 * Themes: `outlined`, `elevated`, `horizontal`, `cover-media`, `stretch-media`.
 */
import { Card } from '@vaadin/react-components/Card.js';
import { Button } from '@vaadin/react-components/Button.js';
import { Badge } from '@vaadin/react-components/Badge.js';
import { Avatar } from '@vaadin/react-components/Avatar.js';
import { Icon } from '@vaadin/react-components/Icon.js';

export const StringTitle = () => (
  <Card cardTitle="Finnair" titleHeadingLevel={3} theme="outlined">
    <span slot="subtitle">Travel · 18 August</span>
    <p style={{ margin: 0 }}>Return flight to Stockholm for the design system workshop.</p>
    <Button slot="footer" theme="primary">
      Approve
    </Button>
    <Button slot="footer" theme="tertiary danger">
      Reject
    </Button>
  </Card>
);

/** Header prefix and suffix: who, and what to do about it. */
export const WithHeaderSlots = () => (
  <Card cardTitle="Stockmann" theme="elevated">
    <Avatar slot="header-prefix" name="Pat Kelly" theme="small" />
    <Badge slot="header-suffix" theme="warning">
      Pending
    </Badge>
    <span slot="subtitle">Meals · 82,50 €</span>
    <p style={{ margin: 0 }}>Client lunch, four attendees.</p>
  </Card>
);

/** Media, and the theme that makes it fill the card's edge. */
export const WithMedia = () => (
  <Card cardTitle="Receipt" theme="outlined cover-media">
    <Icon
      slot="media"
      icon="vaadin:file-picture"
      style={{ width: '100%', height: '5rem', color: 'var(--vaadin-text-color-secondary)' }}
    />
    <span slot="subtitle">taxi-helsinki.pdf</span>
    <p style={{ margin: 0 }}>Uploaded 18 August.</p>
    <Button slot="footer" theme="tertiary">
      Open
    </Button>
  </Card>
);

/** Horizontal: media beside the content rather than above it. */
export const Horizontal = () => (
  <Card cardTitle="Monthly report" theme="horizontal outlined">
    <Icon slot="media" icon="vaadin:chart" style={{ color: 'var(--aura-accent-color)' }} />
    <span slot="subtitle">August 2026</span>
    <p style={{ margin: 0 }}>18 400 € across 34 expenses.</p>
  </Card>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['StringTitle', 'WithHeaderSlots', 'WithMedia', 'Horizontal'];
