// English strings for the "rashifal" namespace. Flat keys; {name} placeholders are interpolated.
const rashifal = {
  'meta.title': 'Today’s Rashifal (Horoscope) {date} — All 12 Moon Signs',
  'meta.description':
    'Daily rashifal for Mesh to Meen, worked out from today’s planetary positions (gochar, Lahiri ayanamsa): work, money, family, health, lucky colour and a simple remedy. Free, in Hindi and English.',
  'sign.metaTitle': '{sign} ({western}) Horoscope Today, {date}',
  'sign.metaDescription':
    '{sign} rashifal for {date}: the day for work, money, family and health, Sade Sati status, lucky colour and number, and a traditional remedy — from today’s gochar.',
  'breadcrumb.rashifal': 'Rashifal',

  'hero.invocation': '॥ श्री गणेशाय नमः ॥',
  'hero.title': 'Today’s rashifal',
  'hero.intro':
    'The day for each of the twelve moon signs, read from where the grahas stand today (gochar) — counted from your rashi, as in the panchang tradition.',
  'panchang.line': '{weekday} · {tithi} · {nakshatra} nakshatra · Moon in {moon}',
  'panchang.link': 'Today’s panchang',

  'grid.title': 'Choose your rashi',
  'grid.read': 'Read {sign} in full',
  'grid.yours': 'Your rashi',
  'rating.aria': 'Day outlook: {rating} of 5',

  'shani.sade_sati_rising': 'Sade Sati · phase 1',
  'shani.sade_sati_peak': 'Sade Sati · phase 2',
  'shani.sade_sati_setting': 'Sade Sati · phase 3',
  'shani.dhaiya_kantak': 'Shani dhaiya',
  'shani.dhaiya_ashtam': 'Shani dhaiya',

  'mine.label': 'My rashi',
  'mine.choose': 'Choose…',
  'mine.clear': 'Forget',
  'mine.fromKundali': 'From your kundali ({name})',
  'mine.fromPreference': 'From your reminder settings',
  'mine.fromDevice': 'Remembered on this device',
  'mine.unknown': 'Not sure of your rashi? Your moon sign comes from your birth date, time and place.',
  'mine.makeKundali': 'Find it with a free kundali',
  'mine.this': 'This is your rashi',
  'mine.setThis': 'Set as my rashi',

  'sign.title': '{sign} rashifal',
  'sign.dayNav': 'Choose a day',
  'day.yesterday': 'Yesterday',
  'day.today': 'Today',
  'day.tomorrow': 'Tomorrow',
  'sign.moon': 'Moon in your {house} house ({sign})',
  'section.overall': 'The day',
  'section.career': 'Work and career',
  'section.money': 'Money',
  'section.love': 'Family and relationships',
  'section.health': 'Health and energy',
  'section.outlook': 'The longer view (Guru, Shani, Rahu)',
  'section.remedy': 'Today’s remedy',
  'section.lucky': 'Lucky colour and number',
  'lucky.colour': 'Colour',
  'lucky.number': 'Number',
  'section.shani': 'Shani for {sign}',
  'section.gochar': 'Today’s gochar from {sign}',
  'gochar.graha': 'Graha',
  'gochar.sign': 'Sign',
  'gochar.house': 'House',
  'gochar.effect': 'Effect',
  'gochar.good': 'Favourable',
  'gochar.mixed': 'Less favourable',
  'gochar.retro': 'retrograde',

  'week.title': 'The next seven days',
  'week.best': 'Better days for new beginnings',
  'week.none': 'No clearly favourable Moon day this week — keep plans steady.',

  'links.title': 'Go further',
  'links.kundali': 'Find your exact rashi',
  'links.kundaliText': 'A free janam kundali gives your moon sign, lagna and dasha.',
  'links.panchang': 'Today’s panchang',
  'links.panchangText': 'Tithi, nakshatra, Rahu kaal and the day’s observances.',
  'links.shani': 'Book a Shani Shanti puja',
  'links.shaniText': 'Many families hold a Shani shanti puja during Sade Sati or dhaiya.',
  'links.remind': 'Get your rashifal every morning',
  'links.remindText': 'Turn on the daily rashifal in Reminders — a notification at 6 am.',
  'links.muhurat': 'Find a shubh muhurat',
  'links.muhuratText': 'Dates for vivah, griha pravesh, mundan, vehicle purchase and more.',

  'other.title': 'Other rashis',
  'note.disclaimer':
    'Rashifal is general guidance. For health, money or legal decisions please consult a qualified professional.',
  'error.unavailable': 'Today’s rashifal could not be loaded. Please try again in a little while.',
} satisfies Record<string, string>;

export default rashifal;
