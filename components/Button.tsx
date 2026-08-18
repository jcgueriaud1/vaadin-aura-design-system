/**
 * Button — the variant system.
 *
 * Verified against @vaadin/react-components@25.2.8.
 *
 * `theme` is a **space-separated list**, and the values compose along three
 * independent axes. Aura's button defines exactly two prominence variants:
 *
 *   prominence   (default) | primary | tertiary
 *   state        danger | error | success | warning | info
 *   size         xsmall | small | medium | large | xlarge
 *
 * `theme="primary danger"` is one prominent button in the danger accent — not
 * two competing variants. There is no `secondary`: the default *is* secondary.
 *
 * A state variant re-points `--aura-accent-color` for that element, so fill,
 * label, border and focus ring all move together and stay mutually legible.
 * That is why `theme="danger"` is the way to make a destructive button red and
 * `style={{ background: 'red' }}` is not: the latter gets you a red box with an
 * unreadable label and a blue focus ring.
 */
import { Button } from '@vaadin/react-components/Button.js';
import { Icon } from '@vaadin/react-components/Icon.js';
import { Tooltip } from '@vaadin/react-components/Tooltip.js';
import { HorizontalLayout } from '@vaadin/react-components/HorizontalLayout.js';

/** One primary per view — the single action the screen is for. */
export function FormActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--vaadin-gap-s)' }}>
      {/* Prominence descends left to right, not colour. */}
      <Button theme="primary" onClick={onSave}>
        Save
      </Button>
      <Button onClick={onCancel}>Cancel</Button>
      <Button theme="tertiary" onClick={onCancel}>
        Discard changes
      </Button>
    </div>
  );
}

/** Destructive actions: the accent carries the meaning. */
export function DestructiveActions({ onDelete }: { onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--vaadin-gap-s)' }}>
      <Button theme="primary danger" onClick={onDelete}>
        Delete permanently
      </Button>
      <Button theme="danger" onClick={onDelete}>
        Delete
      </Button>
      {/* Low-emphasis destructive action, e.g. in a row of a Grid. */}
      <Button theme="tertiary danger small" onClick={onDelete}>
        Remove
      </Button>
    </div>
  );
}

/**
 * Icons go in the `prefix`/`suffix` slots — as slotted children, because these
 * are web component slots and not React props. An icon in the *default* slot is
 * how Aura recognises an icon-only button and tightens its padding.
 *
 * Iconsets are loaded once at the application entry point, next to the theme:
 *
 *   import '@vaadin/aura';
 *   import '@vaadin/icons';
 */
export function IconButtons({ onDownload, onDelete }: { onDownload: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--vaadin-gap-s)' }}>
      <Button onClick={onDownload}>
        <Icon slot="prefix" icon="vaadin:download" />
        Export
      </Button>

      {/* Icon-only: an accessible name and a tooltip are both required
          (DESIGN.md §7). The icon conveys nothing to a screen reader, and
          nothing to a sighted user who doesn't recognise the glyph. */}
      <Button theme="tertiary danger" aria-label="Delete expense" onClick={onDelete}>
        <Icon icon="vaadin:trash" />
        <Tooltip slot="tooltip" text="Delete expense" />
      </Button>
    </div>
  );
}

/**
 * Size is a theme too, and it is inherited: setting it on a container scales
 * everything inside, which is almost always what you want instead of sizing
 * each control. Never set a pixel height — Aura grows controls under
 * `@media (pointer: coarse)` and a fixed height defeats it (DESIGN.md §5).
 */
export function CompactToolbar() {
  return (
    // Set it on a Vaadin layout rather than a plain <div>: `theme` is a real
    // property on Vaadin elements and a typed prop on their React wrappers,
    // while on a host element React would need `{...{ theme: 'small' }}` to
    // emit the attribute at all.
    <HorizontalLayout theme="small" style={{ gap: 'var(--vaadin-gap-xs)' }}>
      <Button>Approve</Button>
      <Button>Reject</Button>
    </HorizontalLayout>
  );
}

/**
 * `disabled` removes the button from the tab order, so the reason it is
 * disabled has to be visible somewhere else — a helper text, a validation
 * message — not in a tooltip nobody can reach.
 */
export function SubmitButton({ pending, canSubmit }: { pending: boolean; canSubmit: boolean }) {
  return (
    <Button theme="primary" disabled={pending || !canSubmit}>
      {pending ? 'Submitting…' : 'Submit'}
    </Button>
  );
}
