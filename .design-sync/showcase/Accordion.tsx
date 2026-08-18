/**
 * Accordion — several Details of which **one** is open at a time.
 *
 * That exclusivity is the whole difference from a stack of Details, and it is
 * what makes an accordion right for a sequence (a checkout, a multi-step form)
 * and wrong for reference material the reader wants to compare — opening the
 * second section closes the first.
 *
 * `opened` is the **index** of the open panel, and `null` means all closed. So
 * it is controlled the same way Tabs is, not by an `opened` boolean per panel.
 *
 * AccordionPanel is the child; its `summary` prop, or an AccordionHeading slotted
 * as the summary, is the header.
 */
import { useState } from 'react';
import { Accordion } from '@vaadin/react-components/Accordion.js';
import { AccordionPanel } from '@vaadin/react-components/AccordionPanel.js';
import { AccordionHeading } from '@vaadin/react-components/AccordionHeading.js';
import { Badge } from '@vaadin/react-components/Badge.js';
import { TextField } from '@vaadin/react-components/TextField.js';
import { VerticalLayout } from '@vaadin/react-components/VerticalLayout.js';

export const OneAtATime = () => {
  const [opened, setOpened] = useState<number | null>(0);

  return (
    <Accordion opened={opened} onOpenedChanged={(event) => setOpened(event.detail.value)}>
      <AccordionPanel summary="1 · What was bought">
        <VerticalLayout theme="spacing">
          <TextField label="Merchant" value="Stockmann" />
          <TextField label="Amount" value="82.50" />
        </VerticalLayout>
      </AccordionPanel>
      <AccordionPanel summary="2 · Who it was for">
        <TextField label="Attendees" value="4" />
      </AccordionPanel>
      <AccordionPanel summary="3 · Receipt">
        <span style={{ color: 'var(--vaadin-text-color-secondary)' }}>Attach the receipt before submitting.</span>
      </AccordionPanel>
    </Accordion>
  );
};

/** `opened={null}` — every panel closed, which no per-panel boolean can express. */
export const AllClosed = () => (
  <Accordion opened={null}>
    <AccordionPanel summary="What was bought">
      <span>…</span>
    </AccordionPanel>
    <AccordionPanel summary="Who it was for">
      <span>…</span>
    </AccordionPanel>
  </Accordion>
);

/** A heading that carries state, via AccordionHeading in the summary slot. */
export const RichHeading = () => (
  <Accordion opened={0}>
    <AccordionPanel>
      <AccordionHeading slot="summary">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vaadin-gap-s)' }}>
          Receipt <Badge theme="error">missing</Badge>
        </span>
      </AccordionHeading>
      <span style={{ color: 'var(--vaadin-text-color-secondary)' }}>Required for amounts over 25 €.</span>
    </AccordionPanel>
    <AccordionPanel summary="Approval">
      <span style={{ color: 'var(--vaadin-text-color-secondary)' }}>Awaiting Ada Nkemelu.</span>
    </AccordionPanel>
  </Accordion>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['OneAtATime', 'AllClosed', 'RichHeading'];
