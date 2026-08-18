`ComboBox` — a long or filterable option set. `import { ComboBox } from '@vaadin/react-components/ComboBox.js';`

**The binding trap:** `value` is always a **string**, never your object. Pick one of two bindings and
stay in it:

```jsx
{/* object items, string value — the usual form field */}
<ComboBox<Country> items={countries} itemLabelPath="name" itemValuePath="code"
                   value={code} onValueChanged={(e) => setCode(e.detail.value)} clearButtonVisible />

{/* object items, object value */}
<ComboBox<Country> items={countries} itemLabelPath="name"
                   selectedItem={country} onSelectedItemChanged={(e) => setCountry(e.detail.value)} />
```

- Without `itemLabelPath` the component stringifies each object and shows `[object Object]` — the most
  common ComboBox bug.
- Mixing the two bindings (writing `value` from `country.code` while reading `selectedItem`) is how
  they go out of sync.
- Past a few hundred options use `dataProvider={async (params, callback) => callback(items, total)}`
  and stop shipping the array; `params` carries `filter`, `page` and `pageSize`.
- `clearButtonVisible` — don't render your own clear affordance.
