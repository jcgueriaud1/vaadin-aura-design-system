/**
 * Upload — files, their progress, and their failures.
 *
 * `Upload` is the whole widget: trigger button, drop zone and file list in one
 * element, driven by `target`. Set `noAuto` when the files should be sent with a
 * form submit rather than the moment they are picked.
 *
 * The per-file states are the part worth designing for, because they are what
 * users actually see: queued, uploading with progress, complete, and failed with
 * a retry. Below, the files are set directly so every state is visible at once —
 * in an application the component maintains this list itself.
 *
 * Since 25 the three pieces are also separate components — UploadButton,
 * UploadDropZone, UploadFileList — sharing one `UploadManager`. That is what to
 * use when the drop zone is the whole page and the button lives in a toolbar.
 */
import { useMemo } from 'react';
import { Upload } from '@vaadin/react-components/Upload.js';
import { UploadButton } from '@vaadin/react-components/UploadButton.js';
import { UploadDropZone } from '@vaadin/react-components/UploadDropZone.js';
import { UploadFileList } from '@vaadin/react-components/UploadFileList.js';
import { UploadManager } from '@vaadin/upload/vaadin-upload-manager.js';
import type { UploadFile } from '@vaadin/react-components/Upload.js';
import type { UploadFile as ManagedFile } from '@vaadin/upload/vaadin-upload-manager.js';
import { Icon } from '@vaadin/react-components/Icon.js';

/**
 * A file in a given state. An upload file is a `File` the component has annotated
 * with transfer state, and only the component ever creates a real one — so a
 * story that wants to show a state has to assert its way there.
 *
 * Generic because the two modules declare *different* `UploadFile` types: the
 * one `Upload` accepts carries the pre-formatted `elapsedStr`/`totalStr` strings
 * it renders, and the manager's does not. They are not interchangeable.
 */
const file = <T,>(name: string, state: Partial<T>) =>
  Object.assign(new File(['receipt'], name, { type: 'application/pdf' }), state) as unknown as T;

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

/** Every per-file state, in one list. */
export const FileStates = () => (
  <Upload
    target="/api/receipts"
    files={[
      file<UploadFile>('taxi-helsinki.pdf', { complete: true, status: 'Complete' }),
      file<UploadFile>('hotel-invoice.pdf', { uploading: true, progress: 62, status: '62%: 3 seconds remaining' }),
      file<UploadFile>('workshop-lunch.pdf', { held: true, status: 'Queued' }),
      file<UploadFile>('too-big.pdf', { error: 'File exceeds the 10 MB limit' }),
    ]}
  />
);

/** Constraints the component enforces and states in its own text. */
export const Constrained = () => (
  <Upload target="/api/receipts" accept="application/pdf,image/*" maxFiles={3} maxFileSize={10_000_000} />
);

/** `nodrop` for contexts where dropping is not discoverable — a dense toolbar. */
export const NoDropZone = () => <Upload target="/api/receipts" nodrop />;

/**
 * The composable form: one manager, three elements you place where they belong.
 * `manager` is a property, so it is passed as a prop here and never serialised.
 */
export const Composed = () => {
  const manager = useMemo(() => {
    const created = new UploadManager({ target: '/api/receipts', noAuto: true, accept: 'application/pdf' });
    created.files = [file<ManagedFile>('taxi-helsinki.pdf', { complete: true, status: 'Complete' })];
    return created;
  }, []);

  return (
    <div style={column}>
      <UploadDropZone manager={manager}>
        <div
          style={{
            padding: 'var(--vaadin-padding-l)',
            border: '1px dashed var(--vaadin-border-color)',
            borderRadius: 'var(--vaadin-radius-m)',
            textAlign: 'center',
            color: 'var(--vaadin-text-color-secondary)',
          }}
        >
          Drop receipts anywhere here
        </div>
      </UploadDropZone>
      <UploadButton manager={manager} theme="primary">
        <Icon slot="prefix" icon="vaadin:upload" />
        Choose receipts
      </UploadButton>
      <UploadFileList manager={manager} />
    </div>
  );
};

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['FileStates', 'Constrained', 'NoDropZone', 'Composed'];
