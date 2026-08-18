/**
 * Fixture: must FAIL the examples check.
 *
 * Never says which version of @vaadin/react-components it was verified against,
 * so nothing catches it when the dependency moves under it.
 */
export function NoClaim() {
  return <span style={{ color: 'var(--vaadin-text-color)' }}>fine, but unverified</span>;
}
