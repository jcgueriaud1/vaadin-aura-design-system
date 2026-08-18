/** Preview stories for components/Select.tsx. */
import { SortSelect, StatusSelect, RequiredSelect } from '../../components/Select';

export const Sort = () => <SortSelect />;
export const RichOptions = () => <StatusSelect />;
export const Required = () => <RequiredSelect />;

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Sort', 'RichOptions', 'Required'];
