/**
 * Grid — typed columns and renderers.
 *
 * Verified against @vaadin/react-components@25.2.8 (see tsconfig.json / npm run check:components).
 *
 * This is the example agents get wrong most often. Two inventions to unlearn:
 * there is no `columns={[…]}` prop — columns are child elements — and a body
 * renderer is a *component type* receiving `{ item, model, original }`, not a
 * function receiving the item.
 */
import { Grid } from '@vaadin/react-components/Grid.js';
import { GridColumn } from '@vaadin/react-components/GridColumn.js';
import { GridSortColumn } from '@vaadin/react-components/GridSortColumn.js';
import { Badge } from '@vaadin/react-components/Badge.js';

type Expense = {
  id: number;
  merchant: string;
  amount: number;
  status: 'approved' | 'pending' | 'rejected';
};

const expenses: Expense[] = [
  { id: 1, merchant: 'Rail Europe', amount: 128.4, status: 'approved' },
  { id: 2, merchant: 'Hotel Kämp', amount: 342.0, status: 'pending' },
  { id: 3, merchant: 'Taxi Helsinki', amount: 24.9, status: 'rejected' },
];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' });

// Aura maps the accent — fill, text, border and focus ring together — for the
// subtree a state theme is set on. Never assign a colour per status instead.
const statusTheme: Record<Expense['status'], string> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
};

export function ExpenseGrid() {
  return (
    // Pass the item type. Without <Expense>, TItem falls back to GridDefaultItem
    // and every renderer below silently degrades to `any`-shaped access.
    <Grid<Expense> items={expenses} allRowsVisible>
      {/* `path` is enough when the cell is the raw value — no renderer needed. */}
      <GridSortColumn<Expense> path="merchant" header="Merchant" />

      {/* A renderer as `children`: a component type, destructuring `item`.
          `({ item }) => …` is the whole pattern; `(item) => …` is the mistake. */}
      <GridColumn<Expense>
        header="Amount"
        textAlign="end"
        // `footer` takes a ReactNode. `footerRenderer` still exists but is
        // deprecated in 25.x — same for `headerRenderer` vs `header`.
        footer={currency.format(expenses.reduce((sum, e) => sum + e.amount, 0))}
      >
        {({ item }) => <span>{currency.format(item.amount)}</span>}
      </GridColumn>

      <GridColumn<Expense> header="Status" autoWidth>
        {({ item }) => <Badge theme={statusTheme[item.status]}>{item.status}</Badge>}
      </GridColumn>
    </Grid>
  );
}

/**
 * A renderer defined outside the JSX is the same thing — a component. Extract
 * one when it grows, so it stays testable and React can keep its identity
 * stable across renders.
 */
function MerchantCell({ item }: { item: Expense }) {
  return (
    <span style={{ display: 'inline-flex', gap: 'var(--vaadin-gap-s)', alignItems: 'center' }}>
      <strong>{item.merchant}</strong>
      <span style={{ color: 'var(--vaadin-text-color-secondary)' }}>#{item.id}</span>
    </span>
  );
}

export function ExpenseGridWithExtractedRenderer() {
  return (
    <Grid<Expense> items={expenses} allRowsVisible>
      {/* `renderer` and `children` are interchangeable; pick one per column. */}
      <GridColumn<Expense> header="Merchant" renderer={MerchantCell} />
    </Grid>
  );
}

/**
 * One column and no tabular semantics is a VirtualList, not a Grid — see
 * DESIGN.md §8. The example above earns its Grid: sorting, alignment, a footer
 * aggregate and column-level auto-width are all column machinery.
 */
