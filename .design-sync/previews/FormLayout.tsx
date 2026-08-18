/** Preview stories for components/FormLayout.tsx. */
import { ExpenseForm, ServerValidatedField, CompactExpenseForm } from '../../components/FormLayout';

const noop = () => {};

export const Responsive = () => <ExpenseForm onSubmit={noop} />;
export const ServerValidation = () => (
  <ServerValidatedField check={async (code) => (code.trim() === '' || code === 'X' ? 'Unknown cost centre' : null)} />
);
export const AutoResponsive = () => <CompactExpenseForm />;

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Responsive', 'AutoResponsive', 'ServerValidation'];
