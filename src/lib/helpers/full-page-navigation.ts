/**
 * Navigates with a full document load instead of a client-side transition.
 *
 * Use it whenever the auth state changes (sign-in, sign-out, password reset, account deletion).
 * With Cache Components, Next.js keeps up to three previous routes mounted but hidden
 * (React Activity), including their rendered data and form inputs. A full load discards them,
 * so no signed-in content or typed password survives in the tab after the change.
 */
export function navigateWithFullReload(path: string): void {
  window.location.assign(path)
}
