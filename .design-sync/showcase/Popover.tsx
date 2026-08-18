/**
 * Popover — rich transient content anchored to a target.
 *
 * Where Tooltip carries a string, Popover carries content: a form, a summary, a
 * short list. It attaches by `for` — the target element's `id` — and never by
 * nesting, so the target can be anything on the page.
 *
 * `trigger` decides how it opens: `['click']` for something the user asks for,
 * `['hover', 'focus']` for a preview. Add `modal` when the content is
 * interactive, so focus is trapped inside it and Escape closes it; without it a
 * form inside a popover can be tabbed out of half-filled.
 *
 * Anything reachable only through a hover popover is unreachable — include
 * `focus`, or use a click trigger (DESIGN.md §7).
 */
import { Popover } from '@vaadin/react-components/Popover.js';
import { Button } from '@vaadin/react-components/Button.js';
import { TextField } from '@vaadin/react-components/TextField.js';
import { TextArea } from '@vaadin/react-components/TextArea.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-s)' };

/** Opened for the card; in an application `opened` is left to the trigger. */
export const OnClick = () => (
  <div style={{ paddingBlockEnd: 'var(--vaadin-padding-xl)' }}>
    <Button id="reject-trigger" theme="danger">
      Reject…
    </Button>
    <Popover for="reject-trigger" trigger={['click']} position="bottom-start" modal withBackdrop opened>
      <div style={{ ...column, minWidth: '18rem', padding: 'var(--vaadin-padding-s)' }}>
        <TextArea label="Reason for rejection" placeholder="The submitter will see this" />
        <div style={{ display: 'flex', gap: 'var(--vaadin-gap-s)' }}>
          <Button theme="primary danger">Reject</Button>
          <Button theme="tertiary">Cancel</Button>
        </div>
      </div>
    </Popover>
  </div>
);

/** A preview: hover *and* focus, so the keyboard can get to it too. */
export const OnHover = () => (
  <div style={{ paddingBlockEnd: 'var(--vaadin-padding-xl)' }}>
    <Button id="merchant-trigger" theme="tertiary">
      Stockmann
    </Button>
    <Popover for="merchant-trigger" trigger={['hover', 'focus']} position="end" theme="arrow">
      <div style={{ ...column, padding: 'var(--vaadin-padding-s)' }}>
        <strong>Stockmann Oyj</strong>
        <span style={{ color: 'var(--vaadin-text-color-secondary)' }}>12 expenses · 1 842 € this year</span>
      </div>
    </Popover>
  </div>
);

/** A small form, modal because it is interactive. */
export const WithForm = () => (
  <div style={{ paddingBlockEnd: 'var(--vaadin-padding-xl)' }}>
    <Button id="tag-trigger">Add tag</Button>
    <Popover for="tag-trigger" trigger={['click']} modal position="bottom">
      <div style={{ ...column, minWidth: '16rem', padding: 'var(--vaadin-padding-s)' }}>
        <TextField label="Tag" autofocus />
        <Button theme="primary">Add</Button>
      </div>
    </Popover>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['OnClick', 'OnHover', 'WithForm'];
