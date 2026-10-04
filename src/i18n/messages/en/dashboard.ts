// English strings for the "dashboard" namespace. Flat keys; {name} placeholders are interpolated.
const dashboard = {
  'page.loading': 'Opening your dashboard…',

  // Welcome band
  'welcome.title': '{greeting}, {name}',
  'welcome.titlePandit': '{greeting}, {name}',

  // Customer home
  'customer.line.loading': 'Gathering your sankalps…',
  'customer.line.underway': 'Your {puja} is underway.',
  'customer.line.upcoming': 'Your {puja} is {when}.',
  'customer.line.empty': 'Every puja begins with a sankalp — a heartfelt intention. What would you like to plan for your family?',
  'customer.next.title': 'Your next puja',
  'customer.next.empty': 'Nothing scheduled yet. Choose a puja and a pandit will help you with the muhurat and samagri.',
  'customer.next.explore': 'Explore pujas',
  'customer.next.online': 'Online',
  'customer.next.atHome': 'At your home',
  'customer.next.withPandit': 'with {name}',
  'customer.next.underwaySince': 'Underway since {time}',
  'customer.next.begins': 'Begins {when}',
  'customer.next.view': 'View booking',
  'customer.actions.title': 'Quick actions',
  'customer.action.pujas': 'Explore pujas',
  'customer.action.pujas.blurb': 'From Griha Pravesh to Satyanarayan Katha',
  'customer.action.browse': 'Find a pandit',
  'customer.action.browse.blurb': 'Verified pandits who come to your home',
  'customer.action.online': 'Online puja',
  'customer.action.online.blurb': 'Join live with family, wherever they are',
  'customer.action.bookings': 'My bookings',
  'customer.action.bookings.blurb': 'Upcoming pujas, receipts and reviews',
  'customer.action.addresses': 'Saved addresses',
  'customer.action.addresses.blurb': 'Where your pandit should arrive',

  // Pandit home
  'pandit.line.loading': 'Preparing your day…',
  'pandit.line.today_one': 'You have {count} puja today.',
  'pandit.line.today_other': 'You have {count} pujas today.',
  'pandit.line.requests_one': '{count} family is waiting to hear from you.',
  'pandit.line.requests_other': '{count} families are waiting to hear from you.',
  'pandit.line.upcomingOnly': 'No pujas today. Your upcoming bookings are below.',
  'pandit.line.quiet': 'A quiet day. May your seva bring peace to many homes.',
  'pandit.bookings.title': 'Today & upcoming',
  'pandit.bookings.all': 'All bookings',
  'pandit.bookings.empty.title': 'No upcoming pujas yet',
  'pandit.bookings.empty.verified': 'When a family books you, the request will appear here with their sankalp details.',
  'pandit.bookings.empty.unverified': 'Once our team approves your profile, families will be able to book you.',
  'pandit.earnings.title': 'Your dakshina',
  'pandit.earnings.caption': 'From completed pujas, after platform commission. Withdraw to your bank account from Payouts.',
  'pandit.earnings.net': 'Total earned',
  'pandit.earnings.month': 'This month',
  'pandit.earnings.upcoming': 'Upcoming pujas',
  'pandit.earnings.completed': 'Completed pujas',
  'pandit.shortcuts.label': 'Pandit shortcuts',
  'pandit.shortcuts.services': 'My pujas & pricing',
  'pandit.shortcuts.profile': 'Profile & availability',
  'pandit.shortcuts.payouts': 'Payouts & bank account',

  // Mobile prompt
  'mobile.title': 'Please verify your mobile number',
  'mobile.why.pandit': 'Families and our team use it to reach you about a booking — on the day of a puja, a quick call matters.',
  'mobile.why.customer': 'Your pandit may need to call you on the day of the puja — for directions, or a last-minute samagri check.',
  'mobile.cta': 'Verify mobile',

  // Confirm dialog
  'confirm.goBack': 'Go back',
  'confirm.wait': 'Please wait…',

  // Relative time ("Your puja is …", "Begins …")
  'when.started': 'started at {time}',
  'when.minute': 'in a minute',
  'when.minutes': 'in {count} minutes',
  'when.hours_one': 'in about an hour',
  'when.hours_other': 'in about {count} hours',
  'when.todayAt': 'today at {time}',
  'when.tomorrowAt': 'tomorrow at {time}',
  'when.days': 'in {count} days',
  'when.week': 'in about a week',
  'when.weeks': 'in about {count} weeks',

  // Puja categories (shared by pandit and admin screens)
  'category.sanskar': 'Sanskar',
  'category.griha': 'Griha & Vastu',
  'category.shanti': 'Shanti & Dosh',
  'category.path': 'Path & Katha',
  'category.festival': 'Festival',
  'category.abhishek': 'Abhishek & Jaap',
  'category.other': 'Other',
  'category.none': 'Uncategorised',

  'puja.fallback': 'Puja',
  'pandit.earnings.due': 'Payment pending',
  'pandit.earnings.onHold': 'On hold',
  'pandit.earnings.settled': 'Paid to you',
  'pandit.earnings.dueHint_one': '{count} puja · withdraw from Payouts',
  'pandit.earnings.dueHint_other': '{count} pujas · withdraw from Payouts',
  'pandit.earnings.holdHint': 'See the reason on the booking, or contact support.',
} satisfies Record<string, string>;

export default dashboard;
