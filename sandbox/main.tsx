/**
 * Render harness for everything this repo claims renders.
 *
 * `npm run check:components` proves the examples and the stories compile against
 * the pinned @vaadin/react-components; this proves they *render*. It is a
 * separate step because it needs a browser, so it isn't part of
 * `npm run validate`:
 *
 *   cd sandbox && npm install && npm run dev
 *
 * Two halves, matching the two kinds of card in .design-sync/config.json:
 *
 * - **Examples** — the curated few-shot examples in `components/`. Every export
 *   is imported by name below, and `scripts/check-examples.mjs` fails if one
 *   isn't: an example nobody mounts is an example nobody has seen run.
 * - **Showcase** — one module per remaining component, picked up from
 *   `.design-sync/showcase/` by `import.meta.glob`. Nothing to maintain here;
 *   adding a component is a new file plus a config entry, and it appears.
 *
 * One component at a time, chosen by the hash, because several of these are
 * page-level (AppLayout) or open overlays on mount (Notification, Popover,
 * Tooltip) and would fight each other on a single page.
 */
import '@vaadin/aura';
import '@vaadin/icons';
import { StrictMode, useEffect, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { ExpenseGrid, ExpenseGridWithExtractedRenderer } from '../components/Grid';
import { CountryPicker, CountryPickerBoundToObject, CurrencyPicker, LazyMerchantPicker } from '../components/ComboBox';
import { SortSelect, StatusSelect, RequiredSelect } from '../components/Select';
import { RejectExpenseDialog, DeleteConfirmation } from '../components/Dialog';
import { ExpenseForm, ServerValidatedField, CompactExpenseForm } from '../components/FormLayout';
import { FormActions, DestructiveActions, IconButtons, CompactToolbar, SubmitButton } from '../components/Button';

const noop = () => {};
const merchants = [{ code: 'a', name: 'Alpha' }, { code: 'b', name: 'Beta' }];

/** The examples, mounted by name — this list is what check-examples.mjs reads. */
const EXAMPLES: Record<string, Array<[string, JSX.Element]>> = {
  Grid: [
    ['ExpenseGrid', <ExpenseGrid />],
    ['ExpenseGridWithExtractedRenderer', <ExpenseGridWithExtractedRenderer />],
  ],
  ComboBox: [
    ['CountryPicker', <CountryPicker />],
    ['CountryPickerBoundToObject', <CountryPickerBoundToObject />],
    ['CurrencyPicker', <CurrencyPicker />],
    ['LazyMerchantPicker', <LazyMerchantPicker search={async () => ({ items: merchants, total: merchants.length })} />],
  ],
  Select: [
    ['SortSelect', <SortSelect />],
    ['StatusSelect', <StatusSelect />],
    ['RequiredSelect', <RequiredSelect />],
  ],
  Dialog: [
    ['RejectExpenseDialog', <RejectExpenseDialog onReject={noop} />],
    ['DeleteConfirmation', <DeleteConfirmation onDelete={noop} />],
  ],
  FormLayout: [
    ['ExpenseForm', <ExpenseForm onSubmit={noop} />],
    ['ServerValidatedField', <ServerValidatedField check={async (code) => (code === 'X' ? 'Unknown cost centre' : null)} />],
    ['CompactExpenseForm', <CompactExpenseForm />],
  ],
  Button: [
    ['FormActions', <FormActions onSave={noop} onCancel={noop} />],
    ['DestructiveActions', <DestructiveActions onDelete={noop} />],
    ['IconButtons', <IconButtons onDownload={noop} onDelete={noop} />],
    ['CompactToolbar', <CompactToolbar />],
    ['SubmitButton', <SubmitButton pending={false} canSubmit />],
  ],
};

/** The showcase stories, discovered rather than listed. */
type Stories = Record<string, ComponentType | string[] | undefined> & { __order?: string[] };

const modules = import.meta.glob<Stories>('../.design-sync/showcase/*.tsx', { eager: true });

const SHOWCASE = Object.entries(modules)
  .map(([path, module]) => ({ name: path.split('/').pop()!.replace(/\.tsx$/, ''), module }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** Declared order first, then anything the module forgot to declare. */
function storiesOf(module: Stories): Array<[string, ComponentType]> {
  const found = Object.entries(module).filter(
    ([key, value]) => /^[A-Z]/.test(key) && typeof value === 'function',
  ) as Array<[string, ComponentType]>;
  const declared = module.__order ?? [];
  return found.sort(([a], [b]) => {
    const ai = declared.indexOf(a);
    const bi = declared.indexOf(b);
    if (ai < 0 && bi < 0) return a.localeCompare(b);
    if (ai < 0) return 1;
    if (bi < 0) return -1;
    return ai - bi;
  });
}

function Cell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        border: '1px solid var(--vaadin-border-color-secondary)',
        borderRadius: 'var(--vaadin-radius-m)',
        padding: 'var(--vaadin-padding-m)',
        minWidth: 0,
      }}
    >
      <h4
        style={{
          margin: '0 0 var(--vaadin-gap-s)',
          fontSize: 'var(--aura-font-size-xs)',
          lineHeight: 'var(--aura-line-height-xs)',
          color: 'var(--vaadin-text-color-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '.04em',
        }}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}

function Harness() {
  const [selected, setSelected] = useState(() => location.hash.slice(1) || 'Button');

  useEffect(() => {
    const onHashChange = () => setSelected(location.hash.slice(1) || 'Button');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const example = EXAMPLES[selected];
  const showcase = SHOWCASE.find((entry) => entry.name === selected);

  const link = (name: string, kind: 'example' | 'showcase') => (
    <a
      key={`${kind}-${name}`}
      href={`#${name}`}
      style={{
        display: 'block',
        padding: 'var(--vaadin-padding-xs) var(--vaadin-padding-s)',
        borderRadius: 'var(--vaadin-radius-s)',
        color: name === selected ? 'var(--aura-accent-text-color)' : 'var(--vaadin-text-color)',
        background: name === selected ? 'var(--aura-accent-surface)' : 'transparent',
        textDecoration: 'none',
      }}
    >
      {name}
    </a>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav
        style={{
          width: '15rem',
          flex: 'none',
          padding: 'var(--vaadin-padding-m)',
          borderInlineEnd: '1px solid var(--vaadin-border-color-secondary)',
          overflow: 'auto',
          maxHeight: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <h3 style={{ marginBlockStart: 0, fontSize: 'var(--aura-font-size-s)' }}>Examples</h3>
        {Object.keys(EXAMPLES).map((name) => link(name, 'example'))}
        <h3 style={{ fontSize: 'var(--aura-font-size-s)' }}>Showcase</h3>
        {SHOWCASE.map(({ name }) => link(name, 'showcase'))}
      </nav>

      <main style={{ flex: 1, minWidth: 0, padding: 'var(--vaadin-padding-l)' }}>
        <h2 style={{ marginBlockStart: 0 }}>{selected}</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--vaadin-gap-l)',
            alignItems: 'start',
          }}
        >
          {example?.map(([title, element]) => (
            <Cell key={title} title={title}>
              {element}
            </Cell>
          ))}
          {showcase &&
            storiesOf(showcase.module).map(([title, Story]) => (
              <Cell key={title} title={title}>
                <Story />
              </Cell>
            ))}
          {!example && !showcase && <p>Nothing named {selected}.</p>}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
