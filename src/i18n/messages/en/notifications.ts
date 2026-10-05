// English strings for the "notifications" namespace. Flat keys; {name} placeholders are interpolated.
const notifications = {
  'bell.label': 'Notifications',
  'bell.labelUnread_one': 'Notifications, {count} unread',
  'bell.labelUnread_other': 'Notifications, {count} unread',
  'live.unread_one': 'You have {count} unread notification.',
  'live.unread_other': 'You have {count} unread notifications.',
  'live.none': 'No unread notifications.',
  'panel.title': 'Notifications',
  'panel.markAll': 'Mark all as read',
  'panel.markAllFailed': 'We couldn’t mark your notifications as read. Please try again.',
  'panel.loading': 'Loading notifications…',
  'panel.error': 'We couldn’t load your notifications just now.',
  'panel.retry': 'Try again',
  'empty.title': 'All quiet for now',
  'empty.body': 'When a booking is confirmed or a sacred day draws near, a gentle note will wait for you here.',
  'item.unread': 'Unread',
  'time.justNow': 'Just now',
  'push.prompt': 'Get these on your phone or computer, even when the app is closed.',
  'push.enable': 'Turn on',
  'push.failed': 'We couldn’t turn on notifications. Please try again.',
  'push.blocked': 'Notifications are blocked for this site. Allow them in your browser settings to get alerts.',
  'push.on': 'Alerts are on for this device',
  'push.disable': 'Turn off',
} satisfies Record<string, string>;

export default notifications;
