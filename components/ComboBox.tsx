/**
 * ComboBox — items/value binding, and the object-vs-string choice.
 *
 * Verified against @vaadin/react-components@25.2.8.
 *
 * Reach for ComboBox when the option set is long or worth filtering by typing.
 * A short fixed set is a Select — see Select.tsx and DESIGN.md §8.
 *
 * The binding trap: `value` is always a **string**, never your object. With an
 * array of objects you either tell the component which string to use
 * (`itemValuePath`) and bind `value`, or bind `selectedItem` and work in objects.
 * Mixing the two — binding `value` to `country.code` while reading
 * `selectedItem` — is how the two go out of sync.
 */
import { useState } from 'react';
import { ComboBox } from '@vaadin/react-components/ComboBox.js';

type Country = { code: string; name: string };

const countries: Country[] = [
  { code: 'FI', name: 'Finland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
];

/**
 * Object items, string value. The usual choice for a form field, because the
 * form value is the code you will submit.
 */
export function CountryPicker() {
  const [code, setCode] = useState('FI');

  return (
    <ComboBox<Country>
      label="Country"
      items={countries}
      // Without these two the component stringifies each object and shows
      // "[object Object]" — the most common ComboBox bug.
      itemLabelPath="name"
      itemValuePath="code"
      value={code}
      // The payload is on `detail.value`, not `event.target.value`. The event is
      // a CustomEvent from the web component, not a React change event.
      onValueChanged={(event) => setCode(event.detail.value)}
      // `clearButtonVisible` — no need to render your own clear affordance.
      clearButtonVisible
    />
  );
}

/**
 * Object items, object value. Use this when the rest of the screen needs the
 * whole item, so you are not looking it up by code on every render.
 */
export function CountryPickerBoundToObject() {
  const [country, setCountry] = useState<Country | null>(countries[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--vaadin-gap-s)' }}>
      <ComboBox<Country>
        label="Country"
        items={countries}
        itemLabelPath="name"
        selectedItem={country}
        // `detail.value` is the item — or null when the user clears the field.
        onSelectedItemChanged={(event) => setCountry(event.detail.value ?? null)}
      />
      <span style={{ color: 'var(--vaadin-text-color-secondary)', fontSize: 'var(--aura-font-size-s)', lineHeight: 'var(--aura-line-height-s)' }}>
        Dialling code for {country?.name ?? 'nothing'}
      </span>
    </div>
  );
}

/**
 * Strings are items too. When the options are already strings there is nothing
 * to configure: no paths, and `value` is the string itself.
 */
export function CurrencyPicker() {
  const [currency, setCurrency] = useState('EUR');

  return (
    <ComboBox
      label="Currency"
      items={['EUR', 'GBP', 'SEK', 'USD']}
      value={currency}
      onValueChanged={(event) => setCurrency(event.detail.value)}
      required
      // The component renders this itself when validation fails; don't wrap it
      // in your own error markup. See FormLayout.tsx.
      errorMessage="Pick a currency"
    />
  );
}

/**
 * Past a few hundred options, stop shipping the array. `dataProvider` is called
 * with the page, page size and the current filter, and you resolve with the
 * page plus the total size — the component never holds the whole set.
 */
export function LazyMerchantPicker({ search }: { search: (filter: string, page: number) => Promise<{ items: Country[]; total: number }> }) {
  return (
    <ComboBox<Country>
      label="Merchant"
      itemLabelPath="name"
      itemValuePath="code"
      dataProvider={async (params, callback) => {
        const { items, total } = await search(params.filter, params.page);
        callback(items, total);
      }}
    />
  );
}
