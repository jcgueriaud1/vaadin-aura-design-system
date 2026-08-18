/**
 * VirtualList — a long list of custom-rendered items.
 *
 * This is the component behind DESIGN.md §8's rule that **a Grid with a single
 * column is a VirtualList**: no columns, no header, no sorting, no selection —
 * just your renderer, virtualised. Everything a Grid does beyond that is
 * machinery you would be paying for and not using.
 *
 * Like Grid, the renderer is `children` typed as a component, and it receives
 * `{ item, model, original }` — the index is `model.index`, not a top-level
 * `index`. Also like Grid, the list needs a height from its container: it
 * virtualises against its own scroll area, and an auto-height list renders every
 * item.
 */
import { VirtualList } from '@vaadin/react-components/VirtualList.js';
import { Avatar } from '@vaadin/react-components/Avatar.js';
import { Badge } from '@vaadin/react-components/Badge.js';

type Activity = { who: string; what: string; when: string; state: 'approved' | 'rejected' | 'pending' };

const states = ['approved', 'rejected', 'pending'] as const;

const activity: Activity[] = Array.from({ length: 500 }, (_, index) => ({
  who: ['Pat Kelly', 'Ada Nkemelu', 'Sam Virtanen'][index % 3],
  what: `Expense EXP-${2200 + index}`,
  when: `${(index % 28) + 1}. August`,
  state: states[index % 3],
}));

const theme = { approved: 'success', rejected: 'error', pending: '' } as const;

export const LongList = () => (
  <VirtualList<Activity> items={activity} style={{ height: '360px' }}>
    {({ item }) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--vaadin-gap-m)',
          padding: 'var(--vaadin-padding-s)',
          borderBottom: '1px solid var(--vaadin-border-color-secondary)',
        }}
      >
        <Avatar name={item.who} theme="small" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div>{item.what}</div>
          <div style={{ color: 'var(--vaadin-text-color-secondary)', fontSize: 'var(--aura-font-size-s)' }}>
            {item.who} · {item.when}
          </div>
        </div>
        <Badge theme={theme[item.state]}>{item.state}</Badge>
      </div>
    )}
  </VirtualList>
);

/** The row number comes off the model, and it is the virtual index. */
export const WithIndex = () => (
  <VirtualList<Activity> items={activity} style={{ height: '200px' }}>
    {({ item, model }) => (
      <div style={{ display: 'flex', gap: 'var(--vaadin-gap-s)', padding: 'var(--vaadin-padding-xs)' }}>
        <span style={{ color: 'var(--vaadin-text-color-secondary)', minWidth: '4ch', textAlign: 'end' }}>
          {model.index + 1}
        </span>
        <span>{item.what}</span>
      </div>
    )}
  </VirtualList>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['LongList', 'WithIndex'];
