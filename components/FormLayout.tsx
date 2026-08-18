/**
 * FormLayout + fields — the validation pattern.
 *
 * Verified against @vaadin/react-components@25.2.8.
 *
 * Where error messages come from: **the field renders its own.** Every Vaadin
 * field carries `required`, `errorMessage`, `invalid` and a `validate()` method,
 * and paints the message in its own error slot with the right colour, spacing
 * and `aria-describedby` wiring. Adding a `<span className="error">` under the
 * field duplicates the message and desynchronises from `invalid`.
 *
 * There is no `<Form>` component in @vaadin/react-components. A submit handler
 * validates the fields it owns — via refs — and refuses if any says no.
 */
import { useRef, useState } from 'react';
import { FormLayout } from '@vaadin/react-components/FormLayout.js';
import { TextField, type TextFieldElement } from '@vaadin/react-components/TextField.js';
import { EmailField, type EmailFieldElement } from '@vaadin/react-components/EmailField.js';
import { NumberField, type NumberFieldElement } from '@vaadin/react-components/NumberField.js';
import { TextArea } from '@vaadin/react-components/TextArea.js';
import { Button } from '@vaadin/react-components/Button.js';

export function ExpenseForm({ onSubmit }: { onSubmit: (values: { merchant: string; email: string; amount: number }) => void }) {
  const merchant = useRef<TextFieldElement>(null);
  const email = useRef<EmailFieldElement>(null);
  const amount = useRef<NumberFieldElement>(null);

  function submit() {
    // `validate()` returns the result *and* sets `invalid`, which is what makes
    // the messages appear. `checkValidity()` is the read-only variant — use it
    // to enable a button without flagging a field the user hasn't touched.
    //
    // `map` then check, never `fields.every((f) => f.validate())`: `every`
    // short-circuits on the first invalid field, so the rest are never asked to
    // validate and never show their message. The user fixes one error, submits,
    // and meets the next one — one at a time.
    const results = [merchant, email, amount].map((field) => field.current?.validate() ?? false);
    if (!results.every(Boolean)) {
      return;
    }

    onSubmit({
      merchant: merchant.current!.value,
      email: email.current!.value,
      amount: Number(amount.current!.value),
    });
  }

  return (
    <>
      {/* Two columns above 40em, one below. `responsiveSteps` is the explicit
          form; `autoResponsive` (below) is the newer, measurement-based one. */}
      <FormLayout
        responsiveSteps={[
          { minWidth: 0, columns: 1 },
          { minWidth: '40em', columns: 2 },
        ]}
      >
        <TextField
          ref={merchant}
          label="Merchant"
          required
          // Shown only when the field is invalid — the component decides when.
          errorMessage="Who was paid?"
        />
        <NumberField
          ref={amount}
          label="Amount"
          required
          min={0}
          step={0.01}
          errorMessage="Enter a positive amount"
        >
          {/* Prefix/suffix are slots, not props. */}
          <span slot="suffix">EUR</span>
        </NumberField>
        <EmailField
          ref={email}
          label="Notify"
          // EmailField brings its own format constraint; you don't supply a
          // regex, and you don't write the "not a valid email" check.
          errorMessage="That isn't an email address"
          helperText="Optional — we'll copy them on the decision."
        />
        {/* Spanning: the layout reads `colspan`/`data-colspan` off the child.
            Written as `data-colspan` because `colspan` is not a property of the
            field element, so React would drop it. */}
        <TextArea label="Notes" data-colspan={2} />
      </FormLayout>

      <div style={{ display: 'flex', gap: 'var(--vaadin-gap-s)', marginBlockStart: 'var(--vaadin-gap-m)' }}>
        <Button theme="primary" onClick={submit}>
          Submit
        </Button>
      </div>
    </>
  );
}

/**
 * Server-side validation — the case constraints can't express. Switch the field
 * to `manualValidation` and you own `invalid` and `errorMessage`; the field
 * stops fighting you by re-validating on blur and clearing your message.
 */
export function ServerValidatedField({ check }: { check: (code: string) => Promise<string | null> }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <TextField
      label="Cost centre"
      manualValidation
      value={value}
      invalid={error !== null}
      errorMessage={error ?? ''}
      onValueChanged={(event) => setValue(event.detail.value)}
      // Validate on commit, not on every keystroke — `change` fires on blur and
      // on Enter, `input` on every character.
      onChange={async () => {
        setError(await check(value));
      }}
    />
  );
}

/**
 * Auto-responsive mode: instead of declaring breakpoints, declare a column
 * width and a maximum, and the layout fits as many columns as the container
 * allows. Prefer it for forms that live in a resizable region — a drawer, a
 * split pane — where the viewport width isn't what actually varies.
 */
export function CompactExpenseForm() {
  return (
    <FormLayout autoResponsive autoRows maxColumns={2} expandColumns>
      <TextField label="Merchant" required errorMessage="Who was paid?" />
      <NumberField label="Amount" required min={0} errorMessage="Enter a positive amount" />
    </FormLayout>
  );
}
