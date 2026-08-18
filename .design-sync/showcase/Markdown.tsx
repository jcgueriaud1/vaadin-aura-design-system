/**
 * Markdown — rendered markdown, styled by Aura.
 *
 * The markdown goes in as **`children`**, not as the `content` prop the web
 * component has: the React wrapper takes the string from children and forwards
 * it to `content`, and its props type omits `content` outright so passing it is
 * a type error. This is one of the few places the wrapper is not a thin pass-
 * through.
 *
 * It renders into its own light DOM, where Aura's typography applies: the
 * headings are the same `h1`–`h6` the rest of the app uses, so a rendered
 * document sits inside a page without a second type scale (DESIGN.md §4).
 *
 * Use it for content that arrives *as* markdown — a policy text, release notes,
 * an LLM's answer. Do not use it to avoid writing JSX: markdown you authored is
 * a string your compiler cannot check.
 *
 * It renders HTML from the source, so treat the input as untrusted unless you
 * control it: markdown allows inline HTML, and this component is not a
 * sanitiser.
 */
import { Markdown } from '@vaadin/react-components/Markdown.js';

const policy = `## Expense policy

Expenses are reimbursed with the **next payroll run** after approval.

1. Attach a receipt for anything over 25 €
2. Split shared meals per attendee
3. Book travel through the agency where possible

| Category | Limit |
| --- | --- |
| Meals | 40 € / person |
| Hotel | 180 € / night |

> Anything outside these limits needs a written justification.

See the [full policy](https://example.com/policy) for the details.`;

export const Document = () => <Markdown>{policy}</Markdown>;

/** Short-form: what an assistant's answer looks like in the same page. */
export const Inline = () => (
  <Markdown>
    This expense was rejected because the receipt covers **two people**. Split it into two lines and resubmit.
  </Markdown>
);

/** Code blocks keep Aura's monospace treatment. */
export const WithCode = () => (
  <Markdown>{"Set the theme once, at the entry point:\n\n```ts\nimport '@vaadin/aura';\n```\n\nNever import a Lumo stylesheet."}</Markdown>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Document', 'Inline', 'WithCode'];
