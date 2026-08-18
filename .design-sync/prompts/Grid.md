`Grid` — tabular data. `import { Grid } from '@vaadin/react-components/Grid.js';`

The component agents get wrong most often. Two inventions to unlearn: there is **no `columns={[…]}`
prop** (columns are child elements), and a body renderer is a **component type** receiving
`{ item, model, original }` — not a function receiving the item.

```jsx
<Grid<Expense> items={expenses} allRowsVisible>
  <GridSortColumn<Expense> path="merchant" header="Merchant" />
  <GridColumn<Expense> header="Amount" textAlign="end" footer={total}>
    {({ item }) => <span>{currency.format(item.amount)}</span>}
  </GridColumn>
</Grid>
```

- `({ item }) => …` is the pattern; `(item) => …` is the mistake.
- **Pass the item type** (`<Grid<Expense>>`), or `TItem` falls back to `GridDefaultItem` and every
  renderer silently degrades to `any` (DESIGN.md §9).
- `path` alone is enough when the cell is the raw value — no renderer needed.
- `header` / `footer` take `ReactNode`; `headerRenderer` / `footerRenderer` are **deprecated** in 25.x.
- `renderer={Component}` and `children` are interchangeable — pick one per column.
- Status cells use a state theme (`<Badge theme="success">`), never a per-status colour (DESIGN.md §6).
- **One column and no tabular semantics is a `VirtualList`**, not a Grid (DESIGN.md §8).
