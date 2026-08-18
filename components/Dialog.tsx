/**
 * Dialog — the open/close state pattern.
 *
 * Verified against @vaadin/react-components@25.2.8.
 *
 * Dialog is **controlled**, and it closes itself: Escape and a backdrop click
 * both set `opened` to false on the element and fire `opened-changed`. A
 * `useState` toggle that only flips on the trigger button therefore drifts —
 * React still thinks the dialog is open, the next `setOpen(true)` is a no-op,
 * and the dialog appears dead. Listening to `onOpenedChanged` is what keeps
 * React's state and the element's state the same fact.
 */
import { useState } from 'react';
import { Dialog } from '@vaadin/react-components/Dialog.js';
import { ConfirmDialog } from '@vaadin/react-components/ConfirmDialog.js';
import { Button } from '@vaadin/react-components/Button.js';
import { TextArea } from '@vaadin/react-components/TextArea.js';

export function RejectExpenseDialog({ onReject }: { onReject: (reason: string) => void }) {
  const [opened, setOpened] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <>
      <Button theme="danger" onClick={() => setOpened(true)}>
        Reject…
      </Button>

      <Dialog
        headerTitle="Reject expense"
        opened={opened}
        // The one line that matters. Not `onClose`, not a toggle — the element
        // reports every open and close through this event, whoever caused it.
        onOpenedChanged={(event) => setOpened(event.detail.value)}
        // `header` and `footer` are ReactNode props; content goes in `children`.
        // `footerRenderer`/`headerRenderer` still exist but are the older API.
        footer={
          <div style={{ display: 'flex', gap: 'var(--vaadin-gap-s)' }}>
            <Button onClick={() => setOpened(false)}>Cancel</Button>
            <Button
              theme="primary danger"
              disabled={reason.trim() === ''}
              onClick={() => {
                onReject(reason);
                setOpened(false);
              }}
            >
              Reject
            </Button>
          </div>
        }
      >
        <TextArea
          label="Reason"
          helperText="The submitter sees this."
          value={reason}
          onValueChanged={(event) => setReason(event.detail.value)}
          style={{ width: '100%' }}
        />
      </Dialog>
    </>
  );
}

/**
 * A dialog whose whole content is a question is a ConfirmDialog. It ships the
 * button row, their ordering and the keyboard handling, so there is nothing to
 * get wrong — and no reason to hand-roll a Dialog with two Buttons in it.
 *
 * Same controlled pattern, plus explicit `onConfirm` / `onCancel` callbacks.
 */
export function DeleteConfirmation({ onDelete }: { onDelete: () => void }) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button theme="tertiary danger" onClick={() => setOpened(true)}>
        Delete
      </Button>

      <ConfirmDialog
        header="Delete this expense?"
        cancelButtonVisible
        confirmText="Delete"
        confirmTheme="primary danger"
        opened={opened}
        onOpenedChanged={(event) => setOpened(event.detail.value)}
        onConfirm={onDelete}
      >
        This cannot be undone.
      </ConfirmDialog>
    </>
  );
}

/**
 * Two rules from DESIGN.md §8 that this component cannot enforce for you:
 *
 * - A Dialog that opens another Dialog is a route. Nested modals trap focus and
 *   strand people two layers deep with one Escape key.
 * - A Dialog blocks. Use one for a decision or a short focused task; anything
 *   the user needs to compare against the page behind it wants a page.
 */
