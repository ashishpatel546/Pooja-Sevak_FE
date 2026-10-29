// English strings for the "muhurat" namespace. Flat keys; {name} placeholders are interpolated.
const muhurat = {
  'meta.title':
    'Shubh Muhurat {years} — Marriage & Griha Pravesh Dates, Choghadiya',
  'meta.description':
    'Free shubh muhurat for your city: wedding and griha pravesh dates clear of Rahu kaal and Bhadra, plus choghadiya, Abhijit and Rahu kaal for any day. In Hindi and English.',

  'hero.invocation': '॥ श्री गणेशाय नमः ॥',
  'hero.title': 'Shubh muhurat',
  'hero.intro':
    'Auspicious dates for a wedding, griha pravesh, mundan, a new vehicle or business, and the good times of any day — worked out for your city from the panchang.',

  'tab.dates': 'Auspicious dates',
  'tab.day': 'Birthday or any day',
  'tabs.label': 'Kind of muhurat',

  'place.text': 'Muhurat for {place}',
  'range.label': 'Look ahead',
  'range.3': '3 months',
  'range.6': '6 months',
  'range.12': '12 months',

  'dates.loading': 'Reading the panchang…',
  'dates.error': 'We couldn’t work out the muhurats just now.',
  'dates.retry': 'Try again',
  'dates.countFor': '{count} days with a {kind} muhurat',
  'dates.none': 'No muhurat in these months. Try looking further ahead.',
  'dates.times': 'Shubh samay',
  'dates.line': '{tithi}, {nakshatra} nakshatra',
  'dates.nextDay': '(next day)',
  'dates.month': '{month} month',

  'blocked.range': '{from} to {to}',
  'blocked.chaturmas':
    'Chaturmas: from Devshayani to Devuthani Ekadashi, while Bhagwan Vishnu rests, weddings, griha pravesh and several samskaras wait.',
  'blocked.kharmas': 'Kharmas: the Sun is in Dhanu or Meena, a time kept for prayer rather than new beginnings.',
  'blocked.adhik': 'Adhik maas (Purushottam maas): the extra lunar month is for devotion, not ceremonies.',
  'blocked.guru_asta': 'Guru asta: Jupiter is hidden by the Sun, so auspicious ceremonies are not held.',
  'blocked.shukra_asta': 'Shukra asta: Venus is hidden by the Sun, so weddings and similar ceremonies are not held.',

  'rules.title': 'How these dates are chosen',
  'rules.vivah':
    'A wedding muhurat needs one of the eleven vivah nakshatras (Rohini, Mrigashira, Magha, Uttara Phalguni, Hasta, Swati, Anuradha, Mula, Uttara Ashadha, Uttara Bhadrapada, Revati), the Sun in Mesha, Vrishabha, Mithuna, Vrishchika, Makara or Kumbha, and a day other than Tuesday or Saturday.',
  'rules.griha_pravesh':
    'Griha pravesh is held by day in Vaishakha, Jyeshtha, Magha or Phalguna, under Rohini, Mrigashira, Uttara Phalguni, Chitra, Anuradha, Uttara Ashadha, Uttara Bhadrapada or Revati, on a Monday, Wednesday, Thursday or Friday.',
  'rules.common':
    'Every time shown avoids rikta tithis (chaturthi, navami, chaturdashi), amavasya, Bhadra, Rahu kaal, Yamaganda and Gulika kaal, and lasts at least one muhurta (48 minutes).',
  'note.guidance':
    'For guidance only. Your pandit ji fixes the final muhurat, also reading the kundali (both, for a wedding), the lagna and your family’s custom.',

  'cta.title': 'Book a pandit ji for your muhurat',
  'cta.text': 'Verified pandits who can confirm the muhurat and perform the vivah, griha pravesh or birthday puja.',
  'cta.button': 'Find a pandit ji',

  'day.date': 'Date',
  'day.birthTitle': 'Birthday by tithi (optional)',
  'day.birthHint': 'Add a date of birth to see when the birth tithi returns this year.',
  'day.birthDate': 'Date of birth',
  'day.birthTime': 'Time of birth (if known)',
  'day.clearBirth': 'Remove',
  'day.panchang': '{tithi}, {nakshatra} nakshatra, {month} month',
  'day.sun': 'Sunrise {rise}, sunset {set}',
  'day.best': 'Best times on this day',
  'day.bestAbout': 'Amrit, shubh and labh choghadiyas and Abhijit muhurat, leaving out Rahu kaal, Yamaganda and Gulika.',
  'day.bestNone': 'No clear good time by day or night; ask your pandit ji.',
  'day.avoid': 'Times to avoid',
  'day.rahu': 'Rahu kaal',
  'day.yamaganda': 'Yamaganda',
  'day.gulika': 'Gulika kaal',
  'day.abhijit': 'Abhijit muhurat',
  'day.abhijitWed': 'Not observed on Wednesday',
  'day.choghadiya': 'Choghadiya',
  'day.daytime': 'Day',
  'day.night': 'Night',
  'day.good': 'Good',
  'day.tithiBirthday': 'Birthday by tithi ({tithi}, {month}): {date}',
  'day.tithiBirthdayNone': 'The birth tithi doesn’t return in the coming year’s calendar; please ask your pandit ji.',

  // Kinds (lib/muhurat.ts → MUHURAT_KINDS)
  'kind.legend': 'Muhurat for',
  'kind.vivah': 'Vivah (wedding)',
  'kindDesc.vivah': 'The wedding ceremony; the pheras may run into the night.',
  'page.title.vivah': 'Vivah Muhurat {years} — Auspicious Wedding Dates',
  'kind.griha_pravesh': 'Griha pravesh',
  'kindDesc.griha_pravesh': 'First entry into a new home.',
  'page.title.griha_pravesh': 'Griha Pravesh Muhurat {years} — Housewarming Dates',
  'kind.mundan': 'Mundan',
  'kindDesc.mundan': 'A child’s first haircut (chudakarma).',
  'page.title.mundan': 'Mundan Muhurat {years} — Dates for a Child’s First Haircut',
  'kind.namkaran': 'Namkaran',
  'kindDesc.namkaran': 'Naming a newborn, usually from the 11th day.',
  'page.title.namkaran': 'Namkaran Muhurat {years} — Naming Ceremony Dates',
  'kind.annaprashan': 'Annaprashan',
  'kindDesc.annaprashan': 'A baby’s first rice, around six months.',
  'page.title.annaprashan': 'Annaprashan Muhurat {years} — First Rice Ceremony Dates',
  'kind.upanayan': 'Upanayan (janeu)',
  'kindDesc.upanayan': 'The sacred thread ceremony.',
  'page.title.upanayan': 'Upanayan (Janeu) Muhurat {years} — Sacred Thread Ceremony Dates',
  'kind.vahan_kharid': 'Vehicle purchase',
  'kindDesc.vahan_kharid': 'Taking delivery of a car or two-wheeler.',
  'page.title.vahan_kharid': 'Vehicle Purchase Muhurat {years} — Shubh Dates to Buy a Car or Bike',
  'kind.sampatti_kharid': 'Property purchase',
  'kindDesc.sampatti_kharid': 'Buying or registering a house, flat or land.',
  'page.title.sampatti_kharid': 'Property Purchase Muhurat {years} — Shubh Dates to Buy a Home',
  'kind.vyapar_arambh': 'Business opening',
  'kindDesc.vyapar_arambh': 'Opening a shop, office or new venture.',
  'page.title.vyapar_arambh': 'Business Opening Muhurat {years} — Shop and Office Udghatan Dates',
  'kind.bhoomi_pujan': 'Bhoomi pujan',
  'kindDesc.bhoomi_pujan': 'Breaking ground before construction.',
  'page.title.bhoomi_pujan': 'Bhoomi Pujan Muhurat {years} — Foundation Dates',
  'rules.mundan':
    'Mundan is held by day on Monday, Wednesday, Thursday or Friday, in Ashwini, Mrigashira, Punarvasu, Pushya, Hasta, Chitra, Swati, Jyeshtha, Shravana, Dhanishtha, Shatabhisha or Revati nakshatra, on shukla 2, 3, 5, 7, 10, 11 or 13 (krishna 2, 3 or 5) — not in Chaturmas, Kharmas, adhik maas or while Guru or Shukra is asta.',
  'rules.namkaran':
    'Namkaran is traditionally on the 11th or 12th day after birth. For a later date: by day on Monday, Wednesday, Thursday or Friday, in a shubh nakshatra (Ashwini, Rohini, Mrigashira, Punarvasu, Pushya, the three Uttaras, Hasta, Chitra, Swati, Anuradha, Shravana, Dhanishtha, Shatabhisha, Revati); only adhik maas is avoided.',
  'rules.annaprashan':
    'Annaprashan is held by day on Monday, Wednesday, Thursday or Friday, in the same shubh nakshatras as namkaran, on shukla 2, 3, 5, 7, 10, 11 or 13 (krishna 2, 3 or 5) — not in Kharmas, adhik maas or Guru/Shukra asta.',
  'rules.upanayan':
    'Upanayan is held in the Uttarayana months (Chaitra, Vaishakha, Jyeshtha, Magha, Phalguna), by day, not on Tuesday or Saturday, on shukla 2, 3, 5, 10, 11 or 12 (krishna 2, 3 or 5), in Ashwini, Mrigashira, Punarvasu, Pushya, the three Uttaras, Hasta, Chitra, Swati, Shravana, Dhanishtha, Shatabhisha or Revati — not in Kharmas, adhik maas or Guru/Shukra asta.',
  'rules.vahan_kharid':
    'Vehicle purchase: by day on Monday, Wednesday, Thursday or Friday, in Ashwini, Mrigashira, Punarvasu, Pushya, Hasta, Chitra, Swati, Anuradha, Shravana, Dhanishtha, Shatabhisha or Revati — not in Kharmas or adhik maas.',
  'rules.sampatti_kharid':
    'Property purchase: by day on Monday, Wednesday, Thursday or Friday, in the fixed and gentle nakshatras (Rohini, Mrigashira, Pushya, the three Uttaras, Chitra, Anuradha, Revati) — not in Kharmas or adhik maas.',
  'rules.vyapar_arambh':
    'Business opening: by day on Monday, Wednesday, Thursday or Friday, in Ashwini, Rohini, Mrigashira, Pushya, the three Uttaras, Hasta, Chitra, Anuradha, Shravana or Revati — not in Kharmas or adhik maas.',
  'rules.bhoomi_pujan':
    'Bhoomi pujan: by day on Monday, Wednesday, Thursday or Friday, in Rohini, Mrigashira, Pushya, the three Uttaras, Hasta, Chitra, Swati, Anuradha, Shravana, Dhanishtha, Shatabhisha or Revati — not in Chaturmas, Kharmas, adhik maas or Guru/Shukra asta.',
  'page.description':
    'Auspicious {kind} dates and times for the coming months, from the panchang for your city — clear of Rahu kaal and Bhadra. Free, in Hindi and English. Your pandit ji fixes the final muhurat.',
  'page.h1': '{kind} muhurat',
  'page.intro': 'Shubh dates and times for {kind}, worked out from the panchang. Your pandit ji confirms the final muhurat for your family.',
  'page.listTitle': 'The next three months in {place}',
  'page.listNote': 'From the New Delhi panchang. Pick your own city in the finder below; times shift a little from city to city.',
  'page.listLater': 'No dates in the next three months. The next ones:',
  'page.listNone': 'No dates found in the coming year for New Delhi.',
  'page.listError': 'The dates could not be loaded just now; please use the finder below.',
  'page.finderTitle': 'Find dates for your city',
  'page.hub': 'All muhurats',
  'page.otherKinds': 'Other muhurats',
  'hub.title': 'A muhurat for every occasion',
  'book.cta': 'Book {puja}',
  'book.forDay': 'Book {puja} for this day',
  'book.title': 'Book a pandit ji for your {kind}',
  'book.text': 'A verified pandit ji confirms the muhurat for your family and performs the puja.',

  'chog.amrit': 'Amrit',
  'chog.shubh': 'Shubh',
  'chog.labh': 'Labh',
  'chog.char': 'Char',
  'chog.udveg': 'Udveg',
  'chog.kaal': 'Kaal',
  'chog.rog': 'Rog',
};

export default muhurat;
