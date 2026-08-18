/**
 * GridTree — a Grid whose rows have children.
 *
 * There is no TreeGrid component: a tree is a Grid with one `GridTreeColumn`,
 * which renders the expand toggle and the indentation. Everything else — sorting,
 * selection, renderers — is the Grid you already know.
 *
 * The hierarchy comes from the data provider, which is called **once per expanded
 * parent**: the same callback receives `parentItem`, and returns that parent's
 * children. `itemHasChildrenPath` names the boolean the Grid reads to decide
 * whether to draw a toggle at all, so a leaf never shows one that opens onto
 * nothing.
 *
 * `itemIdPath` matters here more than in a flat Grid: without it the Grid
 * compares items by reference, and a re-fetched parent collapses.
 */
import { Grid } from '@vaadin/react-components/Grid.js';
import { GridTreeColumn } from '@vaadin/react-components/GridTreeColumn.js';
import { GridColumn } from '@vaadin/react-components/GridColumn.js';

type CostCentre = { id: string; name: string; total: number; children?: CostCentre[] };

const tree: CostCentre[] = [
  {
    id: 'fi',
    name: 'Finland',
    total: 18400,
    children: [
      { id: 'fi-eng', name: 'Engineering', total: 12200, children: [{ id: 'fi-eng-ds', name: 'Design System', total: 3100 }] },
      { id: 'fi-sales', name: 'Sales', total: 6200 },
    ],
  },
  {
    id: 'se',
    name: 'Sweden',
    total: 9100,
    children: [{ id: 'se-sales', name: 'Sales', total: 9100 }],
  },
];

const childrenOf = (parent: CostCentre | null | undefined): CostCentre[] =>
  parent ? (parent.children ?? []) : tree;

const eur = new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const Hierarchy = () => (
  <Grid<CostCentre>
    itemIdPath="id"
    itemHasChildrenPath="children"
    dataProvider={(params, callback) => {
      const items = childrenOf(params.parentItem);
      callback(items, items.length);
    }}
    style={{ height: '320px' }}
  >
    <GridTreeColumn<CostCentre> path="name" header="Cost centre" />
    <GridColumn<CostCentre> header="Total" textAlign="end">
      {({ item }) => <span>{eur.format(item.total)}</span>}
    </GridColumn>
  </Grid>
);

/** `expandedItems` is a controlled property — the tree's open state is yours. */
export const Expanded = () => (
  <Grid<CostCentre>
    itemIdPath="id"
    itemHasChildrenPath="children"
    expandedItems={[tree[0], tree[0].children![0]]}
    dataProvider={(params, callback) => {
      const items = childrenOf(params.parentItem);
      callback(items, items.length);
    }}
    style={{ height: '320px' }}
  >
    <GridTreeColumn<CostCentre> path="name" header="Cost centre" />
    <GridColumn<CostCentre> header="Total" textAlign="end">
      {({ item }) => <span>{eur.format(item.total)}</span>}
    </GridColumn>
  </Grid>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Hierarchy', 'Expanded'];
