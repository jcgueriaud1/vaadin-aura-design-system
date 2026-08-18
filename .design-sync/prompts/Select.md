`Select` — a short, fixed set of options. `import { Select } from '@vaadin/react-components/Select.js';`

```jsx
<Select label="Sort by" items={items} value={value}
        onValueChanged={(e) => setValue(e.detail.value)} />
```

- **`Select` vs `ComboBox`** (DESIGN.md §8): Select when the options are few, fixed and not worth
  typing to find; ComboBox when the set is long or filterable. A Select with 200 options is a scroll
  marathon.
- `items` are `SelectItem` records — `{ label, value }`. Select is **not generic** and has **no
  `selectedItem`**: the value is the option's string `value`. Map back to your object yourself.
- A separator is an item with a `component` tag name and no value: `{ component: 'hr' }`.
- For options that need markup, pass `<ListBox>` / `<Item value="…">` children instead of `items`.
  Always give `<Item>` a `value` — without one Select falls back to text content, which breaks on
  translation.
- The payload is `event.detail.value` (a CustomEvent), never `event.target.value`.
- `placeholder` is the pre-choice state; `required` + `errorMessage` participate in form validation
  like any other field. A placeholder is not a label (DESIGN.md §7).
