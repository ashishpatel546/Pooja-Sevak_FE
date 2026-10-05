// English strings for the "panchang" namespace. Flat keys; {name} placeholders are interpolated.
const panchang = {
  'meta.title': 'Panchang and sacred days',
  'meta.description':
    'Today’s tithi, paksha, nakshatra, sunrise and sunset for your city, with the Purnima, Ekadashi, Pradosh and other sacred days of the next three months.',
  loading: 'Reading the panchang…',

  'hero.title': 'Panchang for {date} · {place}',
  'hero.monthLine': '{month} month, {paksha} paksha · amanta calendar',
  'hero.nakshatra': 'Nakshatra',
  'hero.sunrise': 'Sunrise',
  'hero.sunset': 'Sunset',
  'hero.todayIs': 'Observed today',
  'hero.footnote': 'Calculated at sunrise in {place}. Times are in {zone}.',
  'hero.zoneIst': 'India time (IST)',
  'hero.zoneLocal': '{place} local time ({zone})',
  'hero.moonLabel': 'The moon on {tithi}, about {percent}% lit',
  'hero.unavailableTitle': 'Today’s panchang could not be loaded',
  'hero.unavailableText':
    'Our calendar did not answer just now. Reload in a minute — the sacred days below may still be available.',
  'hero.reload': 'Reload the panchang',

  'line.full': '{month} {paksha} {tithi}',
  'line.monthTithi': '{month} {tithi}',
  'line.pakshaTithi': '{paksha} {tithi}',

  'paksha.shukla': 'Shukla',
  'paksha.krishna': 'Krishna',

  'tithi.1': 'Pratipada',
  'tithi.2': 'Dwitiya',
  'tithi.3': 'Tritiya',
  'tithi.4': 'Chaturthi',
  'tithi.5': 'Panchami',
  'tithi.6': 'Shashthi',
  'tithi.7': 'Saptami',
  'tithi.8': 'Ashtami',
  'tithi.9': 'Navami',
  'tithi.10': 'Dashami',
  'tithi.11': 'Ekadashi',
  'tithi.12': 'Dwadashi',
  'tithi.13': 'Trayodashi',
  'tithi.14': 'Chaturdashi',
  'tithi.15': 'Purnima',
  'tithi.30': 'Amavasya',

  'type.festival': 'Festivals',
  'type.purnima': 'Purnima',
  'type.amavasya': 'Amavasya',
  'type.ekadashi': 'Ekadashi',
  'type.pradosh': 'Pradosh',
  'type.sankashti': 'Sankashti',
  'type.masik_shivratri': 'Masik Shivratri',
  'type.sankranti': 'Sankranti',
  'type.pitru_paksha': 'Pitru Paksha',
  'type.sarva_pitru_amavasya': 'Sarva Pitru Amavasya',

  'list.all': 'All',
  'list.filterLabel': 'Show sacred days of one kind',
  'list.noneOfType': 'None of these fall in the next three months.',
  'list.ongoing': 'Under way',
  'list.remind': 'Remind me',
  'list.remindAria': 'Remind me before every {name}',
  'list.suggested': 'Pujas for this day:',

  'pitru.title': 'Pitru Paksha — the fortnight of the ancestors',
  'pitru.range': '{from} – {to}',
  'pitru.endsIn_one': '{count} day left',
  'pitru.endsIn_other': '{count} days left',
  'pitru.endsToday': 'the last day is today',
  'pitru.what':
    'For sixteen lunar days before Navratri, families honour three generations of ancestors with water, sesame and food. It is believed they are close to us in these days, and that what we offer with faith reaches them.',
  'pitru.invite':
    'These are the days of the ancestors. Offer shraddh on the tithi a loved one left us — and let us keep that tithi for you every year.',
  'pitru.whyTitle': 'Why shraddh?',
  'pitru.why':
    'Shraddh is an offering made with shraddha — faith. It is performed on the tithi on which the person passed away, so its date moves with the moon each year. Tarpan, pind daan and feeding someone in their name are its heart.',
  'pitru.sarva':
    'If you do not know the tithi, Sarva Pitru Amavasya — the last day of the fortnight — is kept for all ancestors.',
  'pitru.bookShraddh': 'Book Pitru Paksha Shraddh',
  'pitru.remember': 'Remember a loved one',

  'view.label': 'What to show',
  'view.all': 'All sacred days',
  'view.festivals': 'Festivals',

  'festivals.title': 'Festivals in the year ahead',
  'festivals.intro':
    'Diwali, Holi, Navratri, Janmashtami and the other great festivals of the next twelve months, dated by the panchang for {place}.',
  'festivals.next': 'Next festival',
  'festivals.empty': 'No festivals were found in the next twelve months.',
  'festivals.unavailable': 'The festival calendar could not be loaded just now. Please open the page again in a little while.',
  'festivals.remindAria': 'Remind me before {name} and the other festivals',

  'upcoming.title': 'Sacred days ahead',
  'upcoming.intro':
    'The next three months of vrat and parv, calculated for {place}, with the pujas families traditionally book for each.',
  'upcoming.empty': 'No sacred days were found in the next three months.',
  'upcoming.unavailable':
    'The list of sacred days could not be loaded right now. Please reload the page in a little while.',

  'cta.title': 'Let us remember for you',
  'cta.text':
    'Choose the days you keep — Ekadashi, Purnima, Pradosh — and we’ll remind you on the day or a week before, by email, SMS or right here.',
  'cta.action': 'Choose my days',

  'place.showing': 'Showing panchang for {place}',
  'place.approx': 'Guessed from your time zone — choose your city for exact sunrise.',
  'place.yourLocation': 'Your location',
  'place.useExact': 'Use my exact location',
  'place.finding': 'Finding your location…',
  'place.updating': 'Updating the panchang for {place}…',
  'place.change': 'Change city',
  'place.fallback': 'We could not calculate the panchang for {place} just now, so this is the panchang for India (IST).',
  'place.dialogTitle': 'Panchang for which city?',
  'place.dialogDesc':
    'Tithi, sunrise and festival dates change from city to city. Choose where you live — even far from home.',
  'place.filter': 'Search a city',
  'place.noMatch': 'No city by that name. Try a nearby big city in the same time zone.',
  'place.india': 'In India',
  'place.abroad': 'Abroad',
  'place.error.unsupported': 'Your browser cannot share location. Please choose your city instead.',
  'place.error.denied':
    'Location is blocked for this site. Allow it in your browser settings, or choose your city instead.',
  'place.error.timeout': 'Finding your location took too long. Please try again, or choose your city.',
  'place.error.unavailable': 'We could not find your location just now. Please choose your city instead.',
} satisfies Record<string, string>;

export default panchang;
