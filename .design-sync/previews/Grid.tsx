/** Preview stories for components/Grid.tsx. */
import { ExpenseGrid, ExpenseGridWithExtractedRenderer } from '../../components/Grid';

export const TypedColumns = () => <ExpenseGrid />;
export const ExtractedRenderer = () => <ExpenseGridWithExtractedRenderer />;

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['TypedColumns', 'ExtractedRenderer'];
