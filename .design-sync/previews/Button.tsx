/**
 * Preview stories for components/Button.tsx.
 *
 * A preview supplies the props the example declares and nothing else: it must
 * not restyle, rewrap or re-implement the example, because the card is the
 * visual claim that *this source* renders *this way*.
 */
import { FormActions, DestructiveActions, IconButtons, CompactToolbar, SubmitButton } from '../../components/Button';

const noop = () => {};

export const Prominence = () => <FormActions onSave={noop} onCancel={noop} />;
export const Destructive = () => <DestructiveActions onDelete={noop} />;
export const WithIcons = () => <IconButtons onDownload={noop} onDelete={noop} />;
export const Compact = () => <CompactToolbar />;
export const Submit = () => <SubmitButton pending={false} canSubmit />;
export const SubmitPending = () => <SubmitButton pending canSubmit={false} />;

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Prominence', 'Destructive', 'WithIcons', 'Compact', 'Submit', 'SubmitPending'];
