/**
 * MasterDetailLayout — a list and the thing you selected, as one component.
 *
 * What you get over a SplitLayout is the responsive behaviour: when the detail no
 * longer fits beside the master, the component shows it as an overlay over the
 * master instead of squeezing both. You write one layout, not a breakpoint.
 *
 * **The React wrapper is not slot-based.** The web component takes
 * `slot="detail"` children, but the wrapper requires
 * `MasterDetailLayout.Master`, `.Detail` and `.DetailPlaceholder` and *throws* on
 * anything else — a runtime error, not a type error, because children are typed
 * as `ReactNode`. This is the one place in this design system where reading the
 * web component's documentation gives you code that compiles and then breaks.
 *
 * `DetailPlaceholder` is what the detail area shows when nothing is selected.
 * Unlike the detail it is simply hidden when it does not fit, so a narrow
 * viewport shows the list rather than a "select something" panel covering it.
 *
 * Render the detail's content **conditionally inside** `.Detail`, not by omitting
 * `.Detail` — that is what lets the component run its view transition.
 *
 * `onDetailEscapePress` and `onBackdropClick` are how it closes while it is an
 * overlay: the same interaction a Dialog gets for free.
 *
 * Set `detailSize`. Without it the detail area takes its *intrinsic* content
 * width and caches it — so a detail of short lines renders as a narrow column
 * with empty space beside it, and it does not widen when the content changes.
 * `masterSize` defaults to `30em`; the detail has no default at all.
 */
import { useState } from 'react';
import { MasterDetailLayout } from '@vaadin/react-components/MasterDetailLayout.js';
import { ListBox } from '@vaadin/react-components/ListBox.js';
import { Item } from '@vaadin/react-components/Item.js';
import { Button } from '@vaadin/react-components/Button.js';

const expenses = ['EXP-2291 · Finnair · 412 €', 'EXP-2292 · Stockmann · 82,50 €', 'EXP-2293 · VR · 64,20 €'];

const frame = {
  height: '380px',
  border: '1px solid var(--vaadin-border-color-secondary)',
  borderRadius: 'var(--vaadin-radius-l)',
  overflow: 'hidden',
};

export const ListAndDetail = () => {
  const [selected, setSelected] = useState<number | null>(0);

  return (
    <div style={frame}>
      <MasterDetailLayout
        style={{ height: '100%' }}
        masterSize="20em"
        detailSize="60%"
        onDetailEscapePress={() => setSelected(null)}
      >
        <MasterDetailLayout.Master>
          <div style={{ padding: 'var(--vaadin-padding-m)' }}>
            <ListBox selected={selected ?? undefined} onSelectedChanged={(event) => setSelected(event.detail.value)}>
              {expenses.map((expense) => (
                <Item key={expense}>{expense}</Item>
              ))}
            </ListBox>
          </div>
        </MasterDetailLayout.Master>

        <MasterDetailLayout.Detail>
          {selected !== null && (
            <div style={{ padding: 'var(--vaadin-padding-l)' }}>
              <h3 style={{ marginBlockStart: 0 }}>{expenses[selected]}</h3>
              <p style={{ color: 'var(--vaadin-text-color-secondary)' }}>Submitted 18 August, awaiting approval.</p>
              <Button theme="tertiary" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          )}
        </MasterDetailLayout.Detail>

        <MasterDetailLayout.DetailPlaceholder>
          <div style={{ padding: 'var(--vaadin-padding-l)', color: 'var(--vaadin-text-color-secondary)' }}>
            Select an expense to see it here.
          </div>
        </MasterDetailLayout.DetailPlaceholder>
      </MasterDetailLayout>
    </div>
  );
};

/** Nothing selected — the placeholder, which is not the same as an empty detail. */
export const Placeholder = () => (
  <div style={frame}>
    <MasterDetailLayout style={{ height: '100%' }} masterSize="20em" detailSize="60%">
      <MasterDetailLayout.Master>
        <div style={{ padding: 'var(--vaadin-padding-m)' }}>
          <ListBox>
            {expenses.map((expense) => (
              <Item key={expense}>{expense}</Item>
            ))}
          </ListBox>
        </div>
      </MasterDetailLayout.Master>
      <MasterDetailLayout.DetailPlaceholder>
        <div style={{ padding: 'var(--vaadin-padding-l)', color: 'var(--vaadin-text-color-secondary)' }}>
          Select an expense to see it here.
        </div>
      </MasterDetailLayout.DetailPlaceholder>
    </MasterDetailLayout>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['ListAndDetail', 'Placeholder'];
