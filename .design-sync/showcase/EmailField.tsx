/**
 * EmailField — a TextField that already knows what an email address is.
 *
 * It ships the pattern, the `type="email"` inputmode (so touch keyboards show
 * the @ key) and the message. Reach for it instead of a TextField with a
 * hand-written regex: yours will be wrong, and it will be wrong differently
 * from every other field in the app.
 *
 * Validation runs on blur, not per keystroke — a field that turns red while the
 * user is still typing the address is telling them off for being unfinished.
 */
import { EmailField } from '@vaadin/react-components/EmailField.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const States = () => (
  <div style={column}>
    <EmailField label="Approver" placeholder="name@example.com" />
    <EmailField label="Approver" value="pat@vaadin.com" clearButtonVisible />
    <EmailField label="Approver" value="pat@" invalid errorMessage="Enter a valid email address" />
  </div>
);

export const Constrained = () => (
  <div style={column}>
    <EmailField label="Work email" required helperText="Company addresses only" pattern=".+@vaadin\.com" />
    <EmailField label="Approver" value="pat@vaadin.com" readonly />
    <EmailField label="Approver" value="pat@vaadin.com" disabled />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['States', 'Constrained'];
