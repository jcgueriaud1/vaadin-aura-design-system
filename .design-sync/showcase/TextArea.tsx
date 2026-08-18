/**
 * TextArea — multi-line text.
 *
 * It grows with its content by default. `minRows` sets the starting height and
 * `maxRows` the point at which it starts scrolling instead of growing; setting a
 * CSS height instead fights the auto-grow and clips the value.
 *
 * `maxlength` plus `helperText` is the honest character counter: the field
 * enforces the limit, the helper text says what it is. A counter that only
 * appears once the user is over the limit tells them too late.
 */
import { TextArea } from '@vaadin/react-components/TextArea.js';

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const AutoGrow = () => (
  <div style={column}>
    <TextArea label="Business purpose" placeholder="Why was this spent?" />
    <TextArea
      label="Business purpose"
      value={'Client workshop in Helsinki.\nTwo days, four attendees.\nApproved by cost centre owner.'}
    />
  </div>
);

export const Bounded = () => (
  <div style={column}>
    <TextArea label="Note" minRows={3} maxRows={5} placeholder="Three rows, scrolls past five" />
    <TextArea label="Summary" maxlength={80} helperText="80 characters at most" value="Taxi from the airport" />
  </div>
);

export const States = () => (
  <div style={column}>
    <TextArea label="Justification" required invalid errorMessage="A justification is required for amounts over 500 €" />
    <TextArea label="Justification" value="Locked once approved" readonly />
    <TextArea label="Justification" value="Not editable here" disabled />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['AutoGrow', 'Bounded', 'States'];
