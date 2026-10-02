// English strings for the "legal" namespace: /terms, /privacy and /refund-policy.
// Long bodies use the small markup understood by <Prose> (src/components/info/prose.tsx):
// blank line = new paragraph, "- " lines = bullet list, **bold**, [label](/path),
// {brand} / {legalName} / {email} / {grievanceEmail} placeholders.
const legal = {
  'common.updated': 'Last updated: {date}',
  'common.toc': 'On this page',
  'common.breadcrumb.terms': 'Terms of Service',
  'common.breadcrumb.privacy': 'Privacy Policy',
  'common.breadcrumb.refund': 'Cancellation & Refund Policy',

  // ───────────── Terms of Service ─────────────
  'terms.meta.title': 'Terms of Service',
  'terms.meta.description':
    'The terms for using Pooja Sevak to book verified pandits for pujas at home or online: accounts, bookings, payments, cancellations and responsibilities.',
  'terms.title': 'Terms of Service',
  'terms.intro':
    'Welcome to {brand}. These terms are an agreement between you and {legalName} ("we", "us") for using the {brand} website and app. By creating an account or making a booking, you accept them. Please read them along with our [Privacy Policy](/privacy) and [Cancellation & Refund Policy](/refund-policy).',

  'terms.service.title': 'What Pooja Sevak does',
  'terms.service.body':
    '{brand} is an online platform that connects devotees with verified pandits for pujas, path and sanskars — at your home, or live online by video for families anywhere in the world.\n\nPandits on {brand} are independent practitioners, not our employees. Each pandit performs rituals according to their own tradition and training; customs vary by region and family. We provide the platform, verification, booking, payment collection and support.',

  'terms.accounts.title': 'Your account',
  'terms.accounts.body':
    '- You must be at least 18 years old to create an account and make bookings.\n- Give accurate details — your name, email and mobile number. You must verify both your email and mobile number before you can book.\n- Keep your password private. You are responsible for activity on your account; tell us at {email} if you think someone else has used it.\n- You may sign in with Google if you prefer; Google’s own terms apply to that sign-in.',

  'terms.booking.title': 'Booking a puja',
  'terms.booking.body':
    '- You choose a puja, a verified pandit, the mode (full or shorter ritual, where offered), and a date and time. All booking times are in India Standard Time (IST).\n- A puja must be booked at least 2 hours in advance and within the pandit’s working hours.\n- For a puja at home, the address must be within the area the pandit travels to. For an online puja, the pandit and the puja must both support online.\n- A booking is confirmed only once payment succeeds. A booking that is not paid within 30 minutes is cancelled automatically, and nothing is charged.\n- The sankalp details you give (names, gotra and so on) are shared with your pandit so the ritual can be performed for your family. Please check them carefully.',

  'terms.payments.title': 'Prices and payment',
  'terms.payments.body':
    '- The full amount you pay, in Indian Rupees, is shown before you pay: the pandit’s dakshina, the puja samagri if you choose to get it from the pandit (pujas at home only), and a platform fee, if one applies — each shown separately. Nothing else is added.\n- Payments are processed securely by our payment partner, Razorpay. We never see or store your full card, UPI or bank details.\n- From the dakshina, {brand} keeps a platform commission and passes the rest to the pandit. Samagri bought through the pandit is passed to them in full.\n- If a pandit asks for anything to be paid outside {brand} for a booked puja, please tell us at {email}.',

  'terms.cancel.title': 'Cancellations and refunds',
  'terms.cancel.body':
    'You can cancel a booking from **My bookings** at any time until the puja has been marked complete. When a paid booking is cancelled — by you, the pandit or us — the full amount is refunded automatically to your original payment method. The details are in our [Cancellation & Refund Policy](/refund-policy).',

  'terms.online.title': 'Online pujas',
  'terms.online.body':
    '- Online pujas take place on a private video link, shown on your booking shortly before the puja begins. The video call is hosted by a third-party meeting provider (currently Jitsi Meet), which processes the audio and video of the call. We do not record online pujas.\n- You need a working internet connection and a device with a camera or speaker. We are not responsible for problems with your own connection or device.\n- Prasad is not shipped for online pujas.',

  'terms.home.title': 'Pujas at your home',
  'terms.home.body':
    '- Please give a correct address and be available at the booked time, with a safe and suitable place for the ritual.\n- Each pandit shares their samagri list for the puja, which you can read in the app before and after booking. For pujas at home you may get all the samagri from the pandit for the price shown; otherwise your family arranges it from the list. Use the booking notes to tell the pandit anything they should know.\n- Treat pandits with courtesy and respect. Pandits are likewise expected to be punctual, respectful and to perform the ritual as booked.',

  'terms.pandits.title': 'For pandits',
  'terms.pandits.body':
    '- Pandits sign up, complete identity verification (KYC) and set up their profile, pujas, dakshina, working hours and travel area. Only verified pandits are shown to devotees.\n- We may refuse, suspend or withdraw verification at any time — for example over incorrect details, complaints or misconduct.\n- Pandits agree to perform each accepted puja as described, at the booked time, and not to ask devotees for payment outside {brand} for a booked puja.\n- The pandit’s share of each payment (the dakshina after our commission, plus the full samagri amount if the family got the samagri from them) is settled to them by {brand}.',

  'terms.conduct.title': 'Acceptable use',
  'terms.conduct.body':
    'Do not misuse {brand}. In particular, do not:\n\n- give false information, impersonate anyone, or book on someone’s behalf without their consent;\n- harass, abuse or threaten pandits, devotees or our team;\n- post reviews that are false, offensive or unrelated to the puja;\n- try to break, overload, scrape or get unauthorised access to the service.',

  'terms.reviews.title': 'Reviews',
  'terms.reviews.body':
    'After a puja is completed you can rate and review the pandit. Reviews must be honest and about your own experience. We may remove reviews that break these terms. By posting a review you allow us to show it on {brand}.',

  'terms.disclaimer.title': 'Faith, panchang and reminders',
  'terms.disclaimer.body':
    '- Pujas are acts of faith. We do not promise any particular spiritual, material or astrological result.\n- Panchang timings (tithi, nakshatra, sunrise and so on) are calculated for the place you choose and are for guidance; local traditions and your pandit may differ.\n- Reminders are sent as a convenience. Please don’t rely on them alone for important dates.',

  'terms.liability.title': 'Our responsibility',
  'terms.liability.body':
    'We work hard to keep {brand} reliable and our pandits trustworthy, but the service is provided "as is". To the extent the law allows, our total liability to you for any booking is limited to the amount you paid for that booking, and we are not liable for indirect or consequential loss. Nothing in these terms limits rights you have under Indian consumer protection law.',

  'terms.termination.title': 'Suspension and closing your account',
  'terms.termination.body':
    'We may suspend or close an account that breaks these terms or the law, and cancel its upcoming bookings (paid bookings are refunded in full). You can ask us to close your account at any time by writing to {email}.',

  'terms.changes.title': 'Changes to these terms',
  'terms.changes.body':
    'We may update these terms as the service grows. We will change the "Last updated" date above and, for significant changes, tell you by email or in the app. Bookings already made continue under the terms in force when you made them.',

  'terms.law.title': 'Governing law and disputes',
  'terms.law.body':
    'These terms are governed by the laws of India. If something goes wrong, please write to us first at {email} — most issues are resolved quickly that way. Disputes that cannot be settled are subject to the courts of competent jurisdiction in India.',
  'terms.law.city': 'Subject to the above, the courts at {city} will have jurisdiction.',

  'terms.contact.title': 'Contact',
  'terms.contact.body':
    'Questions about these terms? Write to {email} or visit our [Contact page](/contact).',

  // ───────────── Privacy Policy ─────────────
  'privacy.meta.title': 'Privacy Policy',
  'privacy.meta.description':
    'How Pooja Sevak collects, uses, shares and protects your personal data, and your rights under India’s Digital Personal Data Protection Act, 2023.',
  'privacy.title': 'Privacy Policy',
  'privacy.intro':
    'Your family’s details — names, gotra, the loved ones you remember — are personal. This policy explains what we collect, why, who we share it with and the choices you have. {legalName} is the Data Fiduciary for your personal data under India’s Digital Personal Data Protection Act, 2023 (DPDP Act).',

  'privacy.collect.title': 'What we collect',
  'privacy.collect.body':
    '- **Account details:** name, email, mobile number and password (stored only in hashed form), your preferred language, and whether your email and mobile are verified. If you sign in with Google, we receive your name and email from Google.\n- **Addresses:** the addresses you save for home pujas, with their map coordinates, so we can find pandits who travel to you.\n- **Family profile (kul parichay):** gotra, kuldevta and family members you choose to add, used for the sankalp.\n- **Remembrances:** names and dates of loved ones whose punyatithi you want to be reminded of.\n- **Bookings:** the puja, pandit, date and time, address or online mode, sankalp details and notes you give.\n- **Payments:** amount, status and the payment and refund reference from Razorpay. Your card, UPI or bank details go directly to Razorpay; we do not receive or store them.\n- **Reminder settings:** the sacred days you follow, how you want to be reminded, and the place used for your panchang.\n- **Reviews** you write after a puja, and **notifications** we send you.\n- **For pandits:** profile (bio, experience, tradition, city, languages), pujas and dakshina, working hours, home location and travel distance, and KYC details. Of your Aadhaar number we keep only the last 4 digits (masked); the full number is never stored.\n- **Technical data:** IP address, browser and device information, and request logs, used to run and secure the service.',

  'privacy.location.title': 'Your location',
  'privacy.location.body':
    'We use your device’s location only when you allow it in your browser — for example to show pandits near you or the panchang for where you are. You can always type or choose a city instead. The place you pick for the panchang is remembered in a cookie (`ps_place`) with its coordinates rounded to about a kilometre.',

  'privacy.purposes.title': 'Why we use it',
  'privacy.purposes.body':
    '- To create and secure your account, and to verify your email and mobile number.\n- To find pandits for your address or for online pujas, and to make, manage and complete your bookings.\n- To take payments and issue refunds.\n- To send booking updates, the reminders you ask for, and service messages by email, in-app notification and (when available) SMS.\n- To verify pandits and keep the platform safe from fraud and misuse.\n- To answer your questions and complaints.\n- To meet our legal, tax and accounting obligations.\n\nWe do not sell your personal data, and we do not use it for third-party advertising.',

  'privacy.consent.title': 'Consent and your choices',
  'privacy.consent.body':
    'We process your personal data on the basis of your consent, given when you sign up and when you choose to share optional details such as your family profile, remembrances or location — and, where the DPDP Act allows, for legitimate uses such as completing a booking you asked for or meeting a legal obligation.\n\nYou can withdraw consent at any time, as easily as you gave it: edit or delete optional details in your account, turn off reminder channels, deny location access in your browser, or write to {grievanceEmail}. Withdrawing consent does not affect processing already done, and we may be unable to provide some services (for example, a booking needs your contact details).',

  'privacy.sharing.title': 'Who we share it with',
  'privacy.sharing.body':
    'We share only what each party needs:\n\n- **The pandit you book** — your name, mobile number, the booking address (for home pujas) and sankalp details, so they can perform the puja.\n- **Razorpay** — to process payments and refunds.\n- **Google** — only if you choose to sign in with Google.\n- **Email and SMS providers** — to deliver verification codes, booking updates and reminders.\n- **Our video meeting provider (currently Jitsi Meet)** — hosts the video call for online pujas. The audio and video of the call pass through and are processed by this provider; anyone with the private link can join, so please don’t share it. We do not record online pujas.\n- **Cloudflare and our hosting providers** — to deliver the website securely and store data.\n- **Government or law-enforcement authorities** — when the law requires it.\n\nThese service providers act on our instructions and may only use your data to provide their service to us.',

  'privacy.cookies.title': 'Cookies and local storage',
  'privacy.cookies.body':
    'We use only what the site needs to work. We do not use advertising or tracking cookies.\n\n- `ps_locale` (cookie, 1 year) — remembers your language, Hindi or English.\n- `ps_place` (cookie, 1 year) — remembers the place for your panchang.\n- Sign-in session (browser local storage) — keeps you signed in on this device until you sign out.\n- Your chosen location and a note that you dismissed the "install app" prompt (browser local storage).\n\nCloudflare may set its own strictly necessary cookies to protect the site from abuse. You can clear cookies and local storage in your browser settings at any time; you will be signed out.',

  'privacy.retention.title': 'How long we keep it',
  'privacy.retention.body':
    '- Account, family profile, address and reminder data: while your account is active. You can delete addresses and remembrances yourself at any time, and deleting your account erases them.\n- Booking, payment and refund records: for as long as Indian tax, accounting and other laws require, even after your account is deleted — in anonymised form, without your name, contact details or sankalp.\n- Server logs: for a limited period, for security and troubleshooting.\n\nWhen data is no longer needed for these purposes, or you withdraw consent and no law requires us to keep it, we delete it or make it anonymous.',

  'privacy.rights.title': 'Your rights',
  'privacy.rights.body':
    'Under the DPDP Act you have the right to:\n\n- **Access** a summary of the personal data we hold about you and how we use it.\n- **Correct, complete or update** it — most details can be edited directly in your account, addresses and family profile.\n- **Erase** it — delete your account yourself at any time from **Account → Delete account**. Upcoming bookings are cancelled and refunded in full, and your name, email, mobile, addresses, family profile, remembrances and notifications are erased at once; booking and payment records the law requires us to keep are retained in anonymised form. If you can’t sign in, write to {grievanceEmail} from your registered email and we will delete it for you.\n- **Grievance redressal** — complain to us, and receive a response.\n- **Nominate** a person to exercise these rights on your behalf in case of death or incapacity.\n\nTo use any of these rights, write to {grievanceEmail} from your registered email. We may ask you to confirm your identity first. If you are not satisfied with our response, you may approach the Data Protection Board of India.',

  'privacy.children.title': 'Children',
  'privacy.children.body':
    'Accounts are for adults (18 and over). We do not knowingly collect personal data from children. When a parent or guardian adds a child’s name to their family profile or sankalp, they do so as the child’s guardian and with their consent, and only for the puja. If you believe a child has given us data directly, write to {grievanceEmail} and we will delete it.',

  'privacy.security.title': 'How we protect it',
  'privacy.security.body':
    'Data travels over encrypted connections (HTTPS). Passwords are stored only as secure hashes, Aadhaar numbers are masked to the last 4 digits, and access to personal data is limited to people who need it to run the service. No system is perfectly secure; if a breach affects your personal data, we will inform you and the Data Protection Board as the law requires.',

  'privacy.location2.title': 'Where your data is stored',
  'privacy.location2.body':
    'Your data is stored with our hosting providers. Some service providers (such as Cloudflare, Google and Razorpay’s partners) may process data outside India. Any such transfer follows the DPDP Act and the rules made under it.',

  'privacy.grievance.title': 'Grievance Officer',
  'privacy.grievance.body':
    'For any question, complaint or request about your personal data, contact our Grievance Officer. We aim to acknowledge complaints within 48 hours and resolve them as quickly as possible, within the time the law allows.',
  'privacy.grievance.name': 'Name',
  'privacy.grievance.email': 'Email',
  'privacy.grievance.address': 'Address',

  'privacy.changes.title': 'Changes to this policy',
  'privacy.changes.body':
    'If we change this policy, we will update the "Last updated" date above and, for significant changes, tell you by email or in the app before they take effect.',

  // ───────────── Cancellation & Refund Policy ─────────────
  'refund.meta.title': 'Cancellation & Refund Policy',
  'refund.meta.description':
    'Cancel a Pooja Sevak booking any time before the puja is complete and get a full, automatic refund to your original payment method.',
  'refund.title': 'Cancellation & Refund Policy',
  'refund.intro':
    'We keep this simple: if a paid booking is cancelled before the puja is complete, you get **all** your money back, automatically, to the way you paid.',

  'refund.glance.title': 'At a glance',
  'refund.glance.body':
    '- **Full refund** of the amount you paid — no cancellation fee, however close to the puja you cancel.\n- You can cancel any time **until the puja is marked complete**.\n- The refund starts **automatically** the moment the booking is cancelled.\n- It goes back to your **original payment method**, typically within **5–7 business days**.',

  'refund.paying.title': 'Paying for a booking',
  'refund.paying.body':
    'You pay online through Razorpay when you book. Your booking is confirmed as soon as the payment succeeds. If you don’t complete payment within 30 minutes, the booking is cancelled automatically and nothing is charged. Any platform fee is shown before you pay and is refunded along with the dakshina. Samagri bought through Pandit ji is also refunded in full if the booking is cancelled; once the puja is done, it is paid to the pandit.',

  'refund.byYou.title': 'If you cancel',
  'refund.byYou.body':
    'Open the booking in [My bookings](/bookings) and choose **Cancel booking**. You can add a reason if you like — it helps your pandit. You can cancel at any time until the puja has been marked complete, and a paid booking is refunded in full.',

  'refund.byUs.title': 'If the pandit or we cancel',
  'refund.byUs.body':
    'Sometimes a pandit cannot make it, or we have to cancel a booking — for example if the pandit is unwell or unavailable. You will be told by email and in the app, and a paid booking is refunded in full, in the same way. You are welcome to book another pandit.',

  'refund.timeline.title': 'How and when you get your money back',
  'refund.timeline.body':
    '- The refund is issued through Razorpay as soon as the booking is cancelled, for the full amount paid.\n- It is credited to your original payment method (the same card, UPI account, net-banking account or wallet), typically within 5–7 business days, depending on your bank.\n- You will get an email and an in-app notification when the refund is issued, and the booking will show it as refunded.\n- If an automatic refund fails for any reason, our team is alerted at once and processes it by hand. If you don’t see your refund within 7 business days, write to {email} with your booking details.',

  'refund.failed.title': 'Failed or double payments',
  'refund.failed.body':
    'If money was deducted but your booking didn’t confirm, or you were charged twice, write to {email} with the booking and the payment reference from your bank or Razorpay receipt. Payments that do not complete are usually reversed by your bank automatically; we will check and refund anything we received for a booking that didn’t go ahead.',

  'refund.completed.title': 'After the puja is complete',
  'refund.completed.body':
    'Once a puja has been marked complete it can no longer be cancelled in the app. If something went wrong — the pandit did not come, the online puja did not take place, or the ritual was not performed as booked — please write to {email} as soon as you can. We will look into it with the pandit and, where appropriate, offer a full or partial refund.',

  'refund.reschedule.title': 'Changing the date or time',
  'refund.reschedule.body':
    'Changing the date or time of a booking isn’t available in the app yet. You can cancel (with a full refund) and book again at the new time, or talk to your pandit.',

  'refund.contact.title': 'Contact',
  'refund.contact.body': 'For any question about a cancellation or refund, write to {email} or see our [Contact page](/contact).',
} satisfies Record<string, string>;

export default legal;
