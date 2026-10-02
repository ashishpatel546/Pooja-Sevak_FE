// English strings for the "errors" namespace. Flat keys; {name} placeholders are interpolated.
const errors = {
  // Shown in toasts / inline when api() fails (see lib/api.ts).
  'api.network': 'We couldn’t reach Pooja Sevak. Check your internet connection and try again.',
  'api.rateLimited': 'Too many attempts in a short time. Please wait a minute and try again.',
  'api.server': 'Our server ran into a problem. Please try again in a moment.',
  'api.generic': 'Something went wrong. Please try again.',

  // app/error.tsx
  'page.title': 'This page didn’t load properly',
  'page.body': 'A small hitch interrupted things. Your bookings and details are safe — please try again.',
  'page.retry': 'Try again',
  'page.home': 'Go to home',
  'page.reference': 'Reference: {digest}',

  // app/not-found.tsx
  'notFound.title': 'This lamp isn’t lit yet',
  'notFound.body': 'The page you were looking for doesn’t exist or has moved. Let’s take you somewhere useful.',
  'notFound.explore': 'Explore pujas',
  'notFound.home': 'Go to home',

  // app/global-error.tsx (shown in both languages, without app providers)
  'global.title': 'Something went wrong',
  'global.body': 'Pooja Sevak couldn’t load. Please try again in a moment.',
  'global.retry': 'Try again',
} satisfies Record<string, string>;

export default errors;
