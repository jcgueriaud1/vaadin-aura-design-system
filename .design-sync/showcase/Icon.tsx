/**
 * Icon — one glyph from a loaded iconset.
 *
 * `icon` is `"<iconset>:<name>"`, and the iconset has to be imported once at the
 * application entry point next to the theme:
 *
 *   import '@vaadin/aura';
 *   import '@vaadin/icons';
 *
 * Miss that import and there is no error: `<Icon icon="vaadin:trash" />` renders
 * an empty box. That silence is the whole trap.
 *
 * Colour and size come from the surrounding text — the icon is `currentColor` at
 * `1em` — so an icon beside a label matches it without being told. Set
 * `--vaadin-icon-size` when you genuinely need a different size, not a `width`,
 * and give it a colour only when the colour carries meaning, from a token
 * (DESIGN.md §4).
 *
 * An icon that means something needs a text alternative; an icon that decorates
 * text already labelled needs none (DESIGN.md §7).
 */
import { Icon } from '@vaadin/react-components/Icon.js';

const row = { display: 'flex', alignItems: 'center', gap: 'var(--vaadin-gap-m)', flexWrap: 'wrap' as const };

export const FromIconsets = () => (
  <div style={row}>
    {['vaadin:file-text', 'vaadin:euro', 'vaadin:calendar', 'vaadin:user', 'vaadin:trash', 'vaadin:download'].map(
      (icon) => (
        <span key={icon} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vaadin-gap-xs)' }}>
          <Icon icon={icon} />
          <code style={{ fontSize: 'var(--aura-font-size-xs)' }}>{icon}</code>
        </span>
      ),
    )}
  </div>
);

/** Inheriting size: the same icon in three type steps, untouched. */
export const InheritsType = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--vaadin-gap-s)' }}>
    {(['s', 'm', 'l', 'xl'] as const).map((step) => (
      <span
        key={step}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--vaadin-gap-xs)',
          fontSize: `var(--aura-font-size-${step})`,
          lineHeight: `var(--aura-line-height-${step})`,
        }}
      >
        <Icon icon="vaadin:coin-piles" /> Reimbursed
      </span>
    ))}
  </div>
);

/** Colour only where colour means something, and always from a token. */
export const Meaningful = () => (
  <div style={row}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vaadin-gap-xs)' }}>
      <Icon icon="vaadin:check-circle" style={{ color: 'var(--aura-green-text)' }} /> Approved
    </span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vaadin-gap-xs)' }}>
      <Icon icon="vaadin:close-circle" style={{ color: 'var(--aura-red-text)' }} /> Rejected
    </span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vaadin-gap-xs)' }}>
      <Icon icon="vaadin:clock" style={{ color: 'var(--vaadin-text-color-secondary)' }} /> Pending
    </span>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['FromIconsets', 'InheritsType', 'Meaningful'];
