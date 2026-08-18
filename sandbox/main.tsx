/**
 * Render harness for the examples in `components/`.
 *
 * `npm run check:components` proves the examples compile against the pinned
 * @vaadin/react-components; this proves they *render*. It is a separate step
 * because it needs a browser, so it isn't part of `npm run validate`:
 *
 *   cd sandbox && npm install && npm run dev
 *
 * Every exported example is mounted below. Adding an example to components/
 * without adding it here means nobody ever sees it run.
 */
import '@vaadin/aura';
import '@vaadin/icons';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ExpenseGrid, ExpenseGridWithExtractedRenderer } from '../components/Grid';
import { CountryPicker, CountryPickerBoundToObject, CurrencyPicker, LazyMerchantPicker } from '../components/ComboBox';
import { SortSelect, StatusSelect, RequiredSelect } from '../components/Select';
import { RejectExpenseDialog, DeleteConfirmation } from '../components/Dialog';
import { ExpenseForm, ServerValidatedField, CompactExpenseForm } from '../components/FormLayout';
import { FormActions, DestructiveActions, IconButtons, CompactToolbar, SubmitButton } from '../components/Button';

const noop = () => {};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--vaadin-gap-s)', paddingBlockEnd: 'var(--vaadin-padding-l)' }}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

const merchants = [{ code: 'a', name: 'Alpha' }, { code: 'b', name: 'Beta' }];

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main style={{ padding: 'var(--vaadin-padding-l)', display: 'flex', flexDirection: 'column' }}>
      <Section title="Grid"><ExpenseGrid /><ExpenseGridWithExtractedRenderer /></Section>
      <Section title="ComboBox">
        <CountryPicker />
        <CountryPickerBoundToObject />
        <CurrencyPicker />
        <LazyMerchantPicker search={async () => ({ items: merchants, total: merchants.length })} />
      </Section>
      <Section title="Select"><SortSelect /><StatusSelect /><RequiredSelect /></Section>
      <Section title="Dialog"><RejectExpenseDialog onReject={noop} /><DeleteConfirmation onDelete={noop} /></Section>
      <Section title="FormLayout">
        <ExpenseForm onSubmit={noop} />
        <ServerValidatedField check={async (code) => (code === 'X' ? 'Unknown cost centre' : null)} />
        <CompactExpenseForm />
      </Section>
      <Section title="Button">
        <FormActions onSave={noop} onCancel={noop} />
        <DestructiveActions onDelete={noop} />
        <IconButtons onDownload={noop} onDelete={noop} />
        <CompactToolbar />
        <SubmitButton pending={false} canSubmit />
      </Section>
    </main>
  </StrictMode>,
);
