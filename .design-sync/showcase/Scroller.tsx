/**
 * Scroller — a scroll region that behaves.
 *
 * `overflow: auto` on a `<div>` scrolls, but the div is not focusable, so a
 * keyboard user cannot scroll it without a pointer, and its padding collapses
 * against the scrollbar. Scroller is focusable, keeps its padding on both edges,
 * and takes Aura's own scrollbar treatment.
 *
 * `scrollDirection` constrains it to one axis, which is what stops a long list
 * from also scrolling sideways by a few pixels.
 *
 * It needs a bounded height from its container — a scroller that is as tall as
 * its content never scrolls.
 */
import { Scroller } from '@vaadin/react-components/Scroller.js';

const rows = Array.from({ length: 30 }, (_, index) => `EXP-${2200 + index}`);

export const Vertical = () => (
  <Scroller
    scrollDirection="vertical"
    style={{ height: '240px', border: '1px solid var(--vaadin-border-color-secondary)', borderRadius: 'var(--vaadin-radius-m)' }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--vaadin-gap-xs)', padding: 'var(--vaadin-padding-s)' }}>
      {rows.map((row) => (
        <div key={row}>{row}</div>
      ))}
    </div>
  </Scroller>
);

export const Horizontal = () => (
  <Scroller
    scrollDirection="horizontal"
    style={{ border: '1px solid var(--vaadin-border-color-secondary)', borderRadius: 'var(--vaadin-radius-m)' }}
  >
    <div style={{ display: 'flex', gap: 'var(--vaadin-gap-s)', padding: 'var(--vaadin-padding-s)' }}>
      {rows.slice(0, 12).map((row) => (
        <div
          key={row}
          style={{
            padding: 'var(--vaadin-padding-s)',
            background: 'var(--aura-accent-surface)',
            borderRadius: 'var(--vaadin-radius-s)',
            whiteSpace: 'nowrap',
          }}
        >
          {row}
        </div>
      ))}
    </div>
  </Scroller>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Vertical', 'Horizontal'];
