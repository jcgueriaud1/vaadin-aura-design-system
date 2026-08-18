/**
 * CheckboxGroup — several related booleans as one field.
 *
 * The value is a **string array** of the checked children's `value`s, so the
 * children need a `value` each and not just a label. That is what makes the
 * group one field with one label, one helper text and one error message rather
 * than a stack of checkboxes each arguing its own case.
 *
 * `theme="vertical"` is the safe default for more than about three options; the
 * horizontal default wraps unpredictably at narrow widths.
 */
import { CheckboxGroup } from '@vaadin/react-components/CheckboxGroup.js';
import { Checkbox } from '@vaadin/react-components/Checkbox.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const ArrayValue = () => (
  <CheckboxGroup label="Categories" value={['travel', 'meals']}>
    <Checkbox value="travel" label="Travel" />
    <Checkbox value="meals" label="Meals" />
    <Checkbox value="software" label="Software" />
  </CheckboxGroup>
);

export const Vertical = () => (
  <CheckboxGroup label="Notify me about" theme="vertical" value={['submitted']} helperText="You can change this later">
    <Checkbox value="submitted" label="Expenses I submit" />
    <Checkbox value="approved" label="Expenses I approve" />
    <Checkbox value="rejected" label="Rejections" />
    <Checkbox value="reminders" label="Month-end reminders" />
  </CheckboxGroup>
);

export const States = () => (
  <div style={column}>
    <CheckboxGroup label="Categories" required invalid errorMessage="Choose at least one category" theme="vertical">
      <Checkbox value="travel" label="Travel" />
      <Checkbox value="meals" label="Meals" />
    </CheckboxGroup>
    <CheckboxGroup label="Categories" value={['travel']} disabled theme="vertical">
      <Checkbox value="travel" label="Travel" />
      <Checkbox value="meals" label="Meals" />
    </CheckboxGroup>
    {/* Disabling one option, not the group: the reason has to be visible. */}
    <CheckboxGroup label="Categories" value={['travel']} theme="vertical" helperText="Software needs manager approval">
      <Checkbox value="travel" label="Travel" />
      <Checkbox value="software" label="Software" disabled />
    </CheckboxGroup>
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['ArrayValue', 'Vertical', 'States'];
