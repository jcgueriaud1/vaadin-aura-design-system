/**
 * GridFilters — finding a row, and the columns that help.
 *
 * `GridFilterColumn` and `GridSortColumn` are ready-made column types: give one
 * a `path` and it renders the header control and applies itself. Reach for these
 * before building a filter bar above the Grid — they filter the data provider
 * rather than the rendered page, so they still work when the data is lazy.
 *
 * `GridFilter` and `GridSorter` are the same controls unbundled, for a header you
 * are composing yourself: a grouped header, or a filter next to a sorter in one
 * cell. That is the only reason to use them directly.
 *
 * `GridColumnGroup` spans several columns under one header. It is presentation
 * only — it cannot carry a `path`, and its children still own the data.
 */
import { Grid } from '@vaadin/react-components/Grid.js';
import { GridColumn } from '@vaadin/react-components/GridColumn.js';
import { GridColumnGroup } from '@vaadin/react-components/GridColumnGroup.js';
import { GridFilterColumn } from '@vaadin/react-components/GridFilterColumn.js';
import { GridSortColumn } from '@vaadin/react-components/GridSortColumn.js';
import { GridFilter } from '@vaadin/react-components/GridFilter.js';
import { GridSorter } from '@vaadin/react-components/GridSorter.js';

type Expense = { merchant: string; category: string; amount: number; date: string };

const expenses: Expense[] = [
  { merchant: 'Stockmann', category: 'Meals', amount: 82.5, date: '2026-08-02' },
  { merchant: 'Finnair', category: 'Travel', amount: 412, date: '2026-08-04' },
  { merchant: 'VR', category: 'Travel', amount: 64.2, date: '2026-08-09' },
  { merchant: 'JetBrains', category: 'Software', amount: 249, date: '2026-08-11' },
  { merchant: 'Scandic', category: 'Travel', amount: 318, date: '2026-08-15' },
];

const eur = new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' });

/** The ready-made column types: one prop each. */
export const FilterAndSortColumns = () => (
  <Grid<Expense> items={expenses} style={{ height: '260px' }}>
    <GridFilterColumn<Expense> path="merchant" header="Merchant" />
    <GridFilterColumn<Expense> path="category" header="Category" />
    <GridSortColumn<Expense> path="amount" header="Amount" textAlign="end">
      {({ item }) => <span>{eur.format(item.amount)}</span>}
    </GridSortColumn>
    <GridSortColumn<Expense> path="date" header="Date" />
  </Grid>
);

/** A header you compose: the sorter and the filter for one column, stacked. */
export const ComposedHeader = () => (
  <Grid<Expense> items={expenses} style={{ height: '280px' }}>
    <GridColumn<Expense>
      path="merchant"
      header={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--vaadin-gap-xs)' }}>
          <GridSorter path="merchant">Merchant</GridSorter>
          <GridFilter path="merchant" />
        </div>
      }
    />
    <GridColumn<Expense>
      path="category"
      header={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--vaadin-gap-xs)' }}>
          <GridSorter path="category">Category</GridSorter>
          <GridFilter path="category" />
        </div>
      }
    />
  </Grid>
);

/** Grouped headers: presentation over columns that still own their own data. */
export const GroupedHeaders = () => (
  <Grid<Expense> items={expenses} style={{ height: '280px' }}>
    <GridColumnGroup header="What">
      <GridFilterColumn<Expense> path="merchant" header="Merchant" />
      <GridFilterColumn<Expense> path="category" header="Category" />
    </GridColumnGroup>
    <GridColumnGroup header="When and how much">
      <GridSortColumn<Expense> path="date" header="Date" />
      <GridSortColumn<Expense> path="amount" header="Amount" textAlign="end">
        {({ item }) => <span>{eur.format(item.amount)}</span>}
      </GridSortColumn>
    </GridColumnGroup>
  </Grid>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['FilterAndSortColumns', 'ComposedHeader', 'GroupedHeaders'];
