/**
 * Preview stories for components/Dialog.tsx.
 *
 * A dialog is invisible until something opens it, and the examples own their
 * `opened` state — that is the point of the pattern. So the preview drives the
 * example the way a user would, by clicking its own trigger, rather than
 * forking the example into an always-open variant that nobody would ship.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { RejectExpenseDialog, DeleteConfirmation } from '../../components/Dialog';

function AutoOpen({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // After paint: the wrapper's <vaadin-button> has to be upgraded before a
    // click does anything.
    const timer = setTimeout(() => host.current?.querySelector<HTMLElement>('vaadin-button')?.click(), 0);
    return () => clearTimeout(timer);
  }, []);

  return <div ref={host}>{children}</div>;
}

const noop = () => {};

export const RejectFlow = () => (
  <AutoOpen>
    <RejectExpenseDialog onReject={noop} />
  </AutoOpen>
);

export const ConfirmFlow = () => (
  <AutoOpen>
    <DeleteConfirmation onDelete={noop} />
  </AutoOpen>
);

/** The closed state — what the page actually shows before a decision is asked for. */
export const Triggers = () => (
  <div style={{ display: 'flex', gap: 'var(--vaadin-gap-s)' }}>
    <RejectExpenseDialog onReject={noop} />
    <DeleteConfirmation onDelete={noop} />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['RejectFlow', 'ConfirmFlow', 'Triggers'];
