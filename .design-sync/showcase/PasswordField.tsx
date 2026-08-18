/**
 * PasswordField — a TextField with a reveal button.
 *
 * The reveal button is there because hidden input causes typos the user cannot
 * see; keep it. `revealButtonHidden` exists for the rare shoulder-surfing
 * context (a shared kiosk), not as a default.
 *
 * Never put a password behind `readonly` or reflect one back into `value` from
 * the server — there is nothing to show and it invites a copy out.
 */
import { PasswordField } from '@vaadin/react-components/PasswordField.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const States = () => (
  <div style={column}>
    <PasswordField label="Password" placeholder="At least 12 characters" />
    <PasswordField label="Password" value="correct horse battery" helperText="A passphrase beats a short password" />
    <PasswordField label="Password" value="hunter2" invalid errorMessage="Too short — 12 characters minimum" />
  </div>
);

export const Variants = () => (
  <div style={column}>
    <PasswordField label="PIN" value="1234" revealButtonHidden helperText="Reveal hidden: shared-screen context" />
    <PasswordField label="Password" value="disabled" disabled />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['States', 'Variants'];
