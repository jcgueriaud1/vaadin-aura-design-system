/**
 * MessageList — a conversation, and MessageInput beneath it.
 *
 * The list is `items` **data**, not children: each item carries its own author,
 * time and text, and the component groups consecutive messages from the same
 * author and exposes the list to screen readers as one log. Rendering your own
 * `<div>` per message loses all three.
 *
 * MessageInput is a textarea and a send button that already agree about Enter:
 * Enter sends, Shift+Enter makes a newline. Read the text from
 * `onSubmit`'s `event.detail.value` and clear nothing — it clears itself.
 *
 * `userColorIndex` picks from Aura's avatar palette, which is what keeps two
 * people visually distinct without you choosing colours (DESIGN.md §4).
 */
import { MessageList } from '@vaadin/react-components/MessageList.js';
import { MessageInput } from '@vaadin/react-components/MessageInput.js';
import { Message } from '@vaadin/react-components/Message.js';
import type { MessageListItem } from '@vaadin/react-components/MessageList.js';

const thread: MessageListItem[] = [
  { text: 'Rejected — the receipt is for two people. Can you split it?', time: '10:42', userName: 'Ada Nkemelu', userColorIndex: 1 },
  { text: 'Sure. Which half is mine?', time: '10:44', userName: 'Pat Kelly', userColorIndex: 2 },
  { text: 'Anything under 40 € goes on your own line.', time: '10:45', userName: 'Ada Nkemelu', userColorIndex: 1 },
];

const column = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--vaadin-gap-m)' };

export const Conversation = () => (
  <div style={column}>
    <MessageList items={thread} />
    <MessageInput />
  </div>
);

/**
 * Message on its own, for a single note that is not a thread — a rejection
 * reason shown beside the expense it belongs to.
 */
export const SingleMessage = () => (
  <Message userName="Ada Nkemelu" userAbbr="AN" time="10:42" userColorIndex={1}>
    Rejected — the receipt is for two people. Can you split it?
  </Message>
);

/** The input's strings are all `i18n`; there are no per-part props. */
export const LocalisedInput = () => (
  <MessageInput i18n={{ message: 'Viesti', send: 'Lähetä' }} />
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Conversation', 'SingleMessage', 'LocalisedInput'];
