/**
 * Notification — transient confirmation that something happened.
 *
 * It is controlled, like Dialog: drive `opened`, listen to `onOpenedChanged`,
 * and let it close itself when `duration` elapses. A notification the user must
 * dismiss is a Dialog wearing the wrong clothes (DESIGN.md §8).
 *
 * `duration` is milliseconds and **`0` means "until dismissed"** — so it is the
 * value you use when you have put an action inside, and never the value you use
 * for a plain "Saved".
 *
 * Notifications render into an overlay container at the page level, not where
 * the JSX sits, which is why several can be open at once and stack by position.
 * Never rely on colour alone to carry the outcome: `theme="error"` needs words
 * that say it failed (DESIGN.md §6).
 */
import { useState } from 'react';
import { Notification } from '@vaadin/react-components/Notification.js';
import { Button } from '@vaadin/react-components/Button.js';
import { Icon } from '@vaadin/react-components/Icon.js';

/** The variants, and the positions they stack in. */
export const Positions = () => (
  <>
    <Notification opened duration={0} position="top-start" theme="success">
      <Icon icon="vaadin:check" style={{ marginInlineEnd: 'var(--vaadin-gap-xs)' }} />
      Expense approved
    </Notification>
    <Notification opened duration={0} position="top-center" theme="contrast">
      Draft saved
    </Notification>
    <Notification opened duration={0} position="bottom-start" theme="error">
      Could not reach the server — nothing was submitted
    </Notification>
    <Notification opened duration={0} position="bottom-end" theme="warning">
      Two receipts are still missing
    </Notification>
  </>
);

/** With an action, and therefore with `duration={0}`. */
export const WithAction = () => {
  const [opened, setOpened] = useState(true);

  return (
    <Notification
      opened={opened}
      duration={0}
      position="bottom-start"
      onOpenedChanged={(event) => setOpened(event.detail.value)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--vaadin-gap-m)' }}>
        <span>Expense deleted</span>
        <Button theme="tertiary-inline" onClick={() => setOpened(false)}>
          Undo
        </Button>
      </div>
    </Notification>
  );
};

/** The ordinary case: it says what happened and leaves on its own. */
export const Transient = () => {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button theme="primary" onClick={() => setOpened(true)}>
        Save
      </Button>
      <Notification
        opened={opened}
        duration={4000}
        position="bottom-start"
        theme="success"
        onOpenedChanged={(event) => setOpened(event.detail.value)}
      >
        Expense saved
      </Notification>
    </>
  );
};

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Positions', 'WithAction', 'Transient'];
