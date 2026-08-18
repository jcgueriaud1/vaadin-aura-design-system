/**
 * AvatarGroup — several people in the space of about two.
 *
 * `items` is data, one entry per person, with the same `name`/`abbr`/`img`/
 * `colorIndex` vocabulary as Avatar. Overlapping Avatars by hand loses what this
 * component adds: `maxItemsVisible` collapses the rest into a "+N" avatar whose
 * own tooltip lists them, so nobody becomes invisible.
 *
 * `maxItemsVisible` counts the overflow avatar itself, so `3` shows two people
 * and a "+N". Set it from the space available, not from the number of people.
 */
import { AvatarGroup } from '@vaadin/react-components/AvatarGroup.js';

const reviewers = [
  { name: 'Pat Kelly', colorIndex: 1 },
  { name: 'Ada Nkemelu', colorIndex: 2 },
  { name: 'Sam Virtanen', colorIndex: 3 },
  { name: 'Wei Zhang', colorIndex: 4 },
  { name: 'Noor Haddad', colorIndex: 5 },
];

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-l)' };

export const Everyone = () => <AvatarGroup items={reviewers} />;

/** Collapsed — the overflow avatar counts towards `maxItemsVisible`. */
export const Collapsed = () => (
  <div style={column}>
    <AvatarGroup items={reviewers} maxItemsVisible={3} />
    <AvatarGroup items={reviewers} maxItemsVisible={2} theme="small" />
  </div>
);

/** Two people, no overflow: the group is also correct at its smallest. */
export const Pair = () => <AvatarGroup items={reviewers.slice(0, 2)} />;

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Everyone', 'Collapsed', 'Pair'];
