/**
 * Avatar — a person, as small as it gets.
 *
 * Give it a `name`: it derives the initials, uses the name as the accessible
 * name, and shows it in a tooltip. `abbr` overrides the derived initials for
 * names initials get wrong; `img` replaces them with a picture and the `name`
 * still does the accessibility work — an avatar with only an `img` is an
 * unlabelled image (DESIGN.md §7).
 *
 * `colorIndex` picks from Aura's avatar palette. It exists so two people are
 * distinguishable without you choosing colours, and it must be derived from
 * something stable about the person (an id), never from their position in a list
 * — otherwise everyone changes colour when the list re-sorts.
 *
 * Sizes are the theme steps, so an avatar inside a `theme="small"` row shrinks
 * with the row.
 */
import { Avatar } from '@vaadin/react-components/Avatar.js';

const row = { display: 'flex', alignItems: 'center', gap: 'var(--vaadin-gap-m)' };

export const Derived = () => (
  <div style={row}>
    <Avatar name="Pat Kelly" colorIndex={1} />
    <Avatar name="Ada Nkemelu" colorIndex={2} />
    <Avatar name="Sam Virtanen" colorIndex={3} />
    <Avatar name="Wei Zhang" colorIndex={4} />
  </div>
);

/** No name at all: the anonymous state, which is a real state. */
export const Anonymous = () => (
  <div style={row}>
    <Avatar />
    <Avatar abbr="?" />
    <Avatar name="Finance team" abbr="FT" colorIndex={5} />
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <Avatar name="Pat Kelly" theme="xsmall" colorIndex={1} />
    <Avatar name="Pat Kelly" theme="small" colorIndex={1} />
    <Avatar name="Pat Kelly" colorIndex={1} />
    <Avatar name="Pat Kelly" theme="large" colorIndex={1} />
    <Avatar name="Pat Kelly" theme="xlarge" colorIndex={1} />
  </div>
);

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Derived', 'Anonymous', 'Sizes'];
