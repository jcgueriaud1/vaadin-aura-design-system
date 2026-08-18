`Dialog` — a decision or a short focused task. `import { Dialog } from '@vaadin/react-components/Dialog.js';`

**Dialog is controlled, and it closes itself.** Escape and a backdrop click both set `opened` false on
the element and fire `opened-changed`. A `useState` toggle that only flips on the trigger drifts: React
still thinks it is open, the next `setOpen(true)` is a no-op, and the dialog appears dead.

```jsx
<Dialog headerTitle="Reject expense" opened={opened}
        onOpenedChanged={(e) => setOpened(e.detail.value)}
        footer={<><Button onClick={close}>Cancel</Button><Button theme="primary danger">Reject</Button></>}>
  <TextArea label="Reason" style={{ width: '100%' }} />
</Dialog>
```

- `onOpenedChanged` is the one line that matters — not `onClose`, not a toggle.
- `header` / `footer` / `children` are `ReactNode` props; `headerRenderer` / `footerRenderer` are the
  older API.
- A dialog whose whole content is a question is a **`ConfirmDialog`** — it ships the button row, its
  ordering and the keyboard handling: `header`, `confirmText`, `confirmTheme`, `cancelButtonVisible`,
  `onConfirm`. Don't hand-roll a Dialog with two Buttons.
- **A Dialog that opens another Dialog is a route** — nested modals trap focus (DESIGN.md §8).
- A Dialog blocks. Anything the user must compare against the page behind it wants a page.
- Transient confirmation is a `Notification`, not a Dialog the user has to dismiss.
