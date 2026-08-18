/**
 * Tooltip — a short label on hover and on focus.
 *
 * Two ways to attach it, and they are not equivalent. Inside a Vaadin component,
 * slot it: `<Tooltip slot="tooltip" text="…" />` as a child, which is what makes
 * an icon-only Button legible (DESIGN.md §7). Anywhere else, point `for` at the
 * target's `id`.
 *
 * It appears on **focus** as well as hover, which is what makes it keyboard
 * reachable — so never put anything in a tooltip that is not also available
 * another way, and never put an action in one at all. A disabled control is out
 * of the tab order entirely, so a tooltip explaining why it is disabled cannot
 * be reached: that reason belongs in helper text.
 *
 * The stories force `manual` + `opened` so the card can show the overlay. In an
 * application you set neither.
 */
import { Tooltip } from '@vaadin/react-components/Tooltip.js';
import { Button } from '@vaadin/react-components/Button.js';
import { Icon } from '@vaadin/react-components/Icon.js';
import { TextField } from '@vaadin/react-components/TextField.js';

/** Slotted into a Vaadin component — the icon-only button case. */
export const Slotted = () => (
  <div style={{ display: 'flex', gap: 'var(--vaadin-gap-l)', paddingBlockEnd: 'var(--vaadin-padding-xl)' }}>
    <Button theme="tertiary" aria-label="Export as CSV">
      <Icon icon="vaadin:download" />
      <Tooltip slot="tooltip" text="Export as CSV" manual opened />
    </Button>
    <Button theme="tertiary danger" aria-label="Delete expense">
      <Icon icon="vaadin:trash" />
      <Tooltip slot="tooltip" text="Delete expense" position="bottom" manual opened />
    </Button>
  </div>
);

/** On a plain element, by id. */
export const ByTarget = () => (
  <div style={{ paddingBlockEnd: 'var(--vaadin-padding-xl)' }}>
    <TextField id="cost-centre" label="Cost centre" value="FI-100" />
    <Tooltip for="cost-centre" text="Four-digit code from the intranet" position="end" manual opened />
  </div>
);

/** Position, for when the default would open off-screen. */
export const Positions = () => (
  <div
    style={{
      display: 'flex',
      gap: 'var(--vaadin-gap-xl)',
      padding: 'var(--vaadin-padding-xl) var(--vaadin-padding-l)',
      justifyContent: 'space-between',
    }}
  >
    {(['top', 'bottom', 'start', 'end'] as const).map((position) => (
      <Button key={position} theme="tertiary">
        {position}
        <Tooltip slot="tooltip" text={position} position={position} manual opened />
      </Button>
    ))}
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Slotted', 'ByTarget', 'Positions'];
