/** Preview stories for components/ComboBox.tsx. */
import { CountryPicker, CountryPickerBoundToObject, CurrencyPicker, LazyMerchantPicker } from '../../components/ComboBox';

// The lazy example is defined by its dataProvider contract, so the preview has
// to supply a resolving one — an empty stub would render an empty dropdown and
// misrepresent the pattern.
const merchants = [
  { code: 'rail', name: 'Rail Europe' },
  { code: 'kamp', name: 'Hotel Kämp' },
  { code: 'taxi', name: 'Taxi Helsinki' },
];

export const StringValue = () => <CountryPicker />;
export const ObjectValue = () => <CountryPickerBoundToObject />;
export const Currency = () => <CurrencyPicker />;
export const LazyLoading = () => (
  <LazyMerchantPicker
    search={async (filter) => {
      const items = merchants.filter((m) => m.name.toLowerCase().includes((filter ?? '').toLowerCase()));
      return { items, total: items.length };
    }}
  />
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['StringValue', 'ObjectValue', 'Currency', 'LazyLoading'];
