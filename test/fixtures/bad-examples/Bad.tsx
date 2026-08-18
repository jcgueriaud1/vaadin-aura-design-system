/**
 * Fixture: must FAIL the examples check.
 *
 * Verified against @vaadin/react-components@24.9.17
 *
 * Claims the wrong generation, imports the Lumo utility stylesheet, and puts a
 * hex colour and a pixel gap in a style object — alongside a correct token
 * reference, so the check has to discriminate rather than reject everything.
 */
import '@vaadin/react-components/css/lumo/Utility.module.css';

export function Bad() {
  return (
    <div style={{ gap: '8px', color: '#4a90d9', padding: 'var(--vaadin-padding-m)' }}>
      <span style={{ borderBlockEnd: '1px solid var(--vaadin-border-color)' }}>ok</span>
      <span style={{ fontSize: 'var(--lumo-font-size-m)' }}>not ok</span>
    </div>
  );
}
