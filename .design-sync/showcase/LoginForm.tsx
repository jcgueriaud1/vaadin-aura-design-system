/**
 * LoginForm — the one form you should not hand-roll.
 *
 * It ships the parts that are easy to get wrong and invisible when you do:
 * autocomplete tokens password managers recognise, a submit that works on Enter,
 * the error region announced to a screen reader, and a disabled state during the
 * round trip. Read the credentials from the `login` event.
 *
 * `error` shows the message from `i18n.errorMessage`. Say what the user can do
 * and never which half was wrong — "check your details" rather than "no such
 * user", which tells an attacker the account exists.
 *
 * All visible strings come from `i18n`; there is no `label` prop per field.
 */
import { useState } from 'react';
import { LoginForm } from '@vaadin/react-components/LoginForm.js';
import { LoginOverlay } from '@vaadin/react-components/LoginOverlay.js';
import { Button } from '@vaadin/react-components/Button.js';

export const Standalone = () => <LoginForm noForgotPassword />;

export const WithError = () => (
  <LoginForm
    error
    i18n={{
      errorMessage: {
        title: 'Could not sign in',
        message: 'Check your email address and password and try again.',
        username: 'Email address is required',
        password: 'Password is required',
      },
    }}
  />
);

/** Submitting: disabled while the request is in flight, so it cannot be sent twice. */
export const Submitting = () => <LoginForm disabled noForgotPassword />;

/** Localised, and with the forgotten-password link kept. */
export const Localised = () => (
  <LoginForm
    i18n={{
      form: {
        title: 'Kirjaudu sisään',
        username: 'Sähköposti',
        password: 'Salasana',
        submit: 'Kirjaudu',
        forgotPassword: 'Unohtuiko salasana?',
      },
    }}
  />
);

/**
 * LoginOverlay is the same form as a full-screen, non-dismissable overlay: the
 * right shape when signing in is the whole page rather than part of one.
 *
 * Unlike Dialog it has **no `opened-changed` event** — it cannot be dismissed,
 * which is the point, so there is nothing to report. It fires `closed` once a
 * successful login has closed it, and that is what returns `opened` to false.
 */
export const AsOverlay = () => {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button theme="primary" onClick={() => setOpened(true)}>
        Sign in
      </Button>
      <LoginOverlay
        opened={opened}
        onClosed={() => setOpened(false)}
        i18n={{ header: { title: 'Expense Manager', description: 'Sign in with your company account' } }}
      />
    </>
  );
};

/** Card order — stories are otherwise listed alphabetically. */
export const __order = ['Standalone', 'WithError', 'Submitting', 'Localised', 'AsOverlay'];
