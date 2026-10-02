// Business details: the admin form (Admin → Settings) and the few labels the
// public pages need beyond the info/legal namespaces.
const business = {
  // Public pages
  'public.phone': 'Phone',

  // Admin form
  title: 'Business details',
  desc: 'Shown on the Contact, Terms, Privacy and Refund policy pages and in search results. Blank fields stay hidden on the site.',
  loadError: 'We couldn’t load the business details',
  'lang.en': 'English',
  'lang.hi': 'हिन्दी',
  optional: 'Optional',
  save: 'Save business details',
  saved: 'Business details saved. The public pages now show them.',
  savedStale: 'Business details saved. The public pages will show them within 5 minutes.',
  fixErrors: 'Please fix the highlighted fields.',
  unsaved: 'You have unsaved changes.',

  'group.identity': 'Business identity',
  'group.identity.desc': 'Your registered name, address and tax details.',
  'group.support': 'Support',
  'group.support.desc': 'How families reach you. Shown on the Contact page.',
  'group.grievance': 'Grievance officer',
  'group.grievance.desc': 'Required under the IT Rules 2021 and the DPDP Act 2023. Shown in the Privacy policy.',
  'group.legal': 'Legal',
  'group.legal.desc': 'Used in the Terms of service and on every legal page.',

  'field.legalName': 'Registered business name',
  'field.legalName.hint':
    'The legal entity or proprietor’s name. Appears in the Contact address block and the legal pages.',
  'field.gstin': 'GSTIN',
  'field.gstin.hint': '15 characters, e.g. 09ABCDE1234F1Z5. Shown under the address on the Contact page.',
  'field.address': 'Postal address',
  'field.address.hint': 'One line per row. Shown on the Contact page and in the Privacy policy.',
  'field.supportEmail': 'Support email',
  'field.supportEmail.hint': 'Shown on every info and legal page.',
  'field.supportPhone': 'Support phone',
  'field.supportPhone.hint': 'e.g. +91 98765 43210. Shown on the Contact page.',
  'field.supportHours': 'Support hours',
  'field.supportHours.hint': 'Shown under the phone number, e.g. 10:00–19:00 IST, Mon–Sat.',
  'field.responseHours': 'First reply within (hours)',
  'field.responseHours.hint': 'Promised on the Contact page: “We usually reply within … hours”.',
  'field.officerName': 'Name',
  'field.officerName.hint': 'Shown in the Privacy policy.',
  'field.officerEmail': 'Email',
  'field.officerEmail.hint': 'Leave blank to use the support email.',
  'field.officerPhone': 'Phone',
  'field.officerPhone.hint': 'Shown in the Privacy policy.',
  'field.city': 'Jurisdiction city',
  'field.city.hint': 'Courts of this city have jurisdiction (Terms → Governing law). Leave blank to omit the sentence.',
  'field.updated': '“Last updated” date',
  'field.updated.hint': 'Shown at the top of Terms, Privacy and Refund policy. Update it when you change their text.',

  'err.required': 'This field is required.',
  'err.tooLong': 'Keep it under {max} characters.',
  'err.email': 'Enter a valid email address.',
  'err.phone': 'Enter a phone number with 10–13 digits, e.g. +91 98765 43210.',
  'err.gstin': 'Enter a valid 15-character GSTIN, e.g. 09ABCDE1234F1Z5.',
  'err.hours': 'Enter whole hours between 1 and 720.',
  'err.date': 'Choose a valid date.',
} satisfies Record<string, string>;

export default business;
