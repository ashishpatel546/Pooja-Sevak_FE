/**
 * Returns `next` only when it is a same-site path ("/bookings/1"), never a
 * protocol-relative or absolute URL ("//evil.com", "https://…", "/\\evil.com").
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  if (/[\u0000-\u001f]/.test(next)) return null;
  return next;
}

/**
 * Where a freshly signed-in user lands when there is no `next`: admin → /admin,
 * pandit → /dashboard (pandit home with the setup checklist), devotee → home page.
 */
export function homeFor(user: { role: string }): string {
  if (user.role === 'admin') return '/admin';
  if (user.role === 'pandit') return '/dashboard';
  return '/';
}

const pathOf = (next: string) => next.split(/[?#]/)[0];
const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/**
 * Whether a role may usefully land on `next`. Area pages are role-gated in
 * the app too; this just avoids a bounce (or a "wrong account" screen) right
 * after signing in.
 */
export function roleCanVisit(role: string, next: string): boolean {
  const path = pathOf(next);
  // Auth pages are never a sensible place to return to after signing in.
  if (['/login', '/signup', '/auth'].some((p) => under(path, p))) return false;
  if (under(path, '/admin')) return role === 'admin';
  if (under(path, '/pandit')) return role === 'pandit';
  const customerOnly =
    under(path, '/bookings') || under(path, '/addresses') || /^\/pandits\/[^/]+\/book(\/|$)/.test(path);
  if (customerOnly) return role === 'customer';
  return true;
}

/**
 * Where to go right after login/signup/Google: a safe same-site `next` the
 * role may see, otherwise the role's home (see homeFor).
 */
export function destinationAfterAuth(user: { role: string }, next: string | null | undefined): string {
  const safe = safeNext(next);
  return safe && roleCanVisit(user.role, safe) ? safe : homeFor(user);
}
