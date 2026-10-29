// English strings for the "tools" namespace: the free jyotish tools (kundali, milan,
// muhurat, panchang, rashifal) — their SEO copy, cross-links, login-free previews,
// sharing and the push pre-prompt. Flat keys; {name} placeholders are interpolated.
const tools = {
  // ── Metadata ──────────────────────────────────────────────────────────────
  'meta.milan.title': 'Free Kundli Milan — 36 Guna Kundali Matching by Date of Birth',
  'meta.milan.description':
    'Free kundali matching for marriage: 36-guna Ashtakoot score, Manglik check, Nadi and Bhakoot dosha, with a detailed report in Hindi or English.',

  // ── Page headings ─────────────────────────────────────────────────────────
  'h1.kundali': 'Free Janam Kundali',
  'lead.kundali':
    'Enter the date, time and place of birth to see the lagna, Moon sign and nakshatra straight away. Sign in, free, for the full kundali: nine grahas, Manglik dosha, Vimshottari dasha, yogas and a PDF, in Hindi or English.',
  'h1.milan': 'Kundali Milan (36 Gunas)',
  'lead.milan':
    'Ashtakoot guna milan for marriage: see the score out of 36 and all eight koots straight away. Sign in, free, for the full report with Manglik, Nadi and Bhakoot dosha and both kundalis.',

  'breadcrumb.kundali': 'Janam Kundali',
  'breadcrumb.milan': 'Kundali Milan',
  'breadcrumb.muhurat': 'Shubh Muhurat',
  'breadcrumb.panchang': 'Panchang',

  // ── Free tools (home section and the strip on every tool page) ────────────
  'home.eyebrow': 'Free jyotish tools',
  'home.title': 'Free kundali, milan, muhurat and panchang',
  'home.lead': 'Calculated precisely for your city, in Hindi or English. No payment, ever.',
  'links.title': 'More free tools',
  'links.label': 'Free jyotish tools',
  'tool.kundali.name': 'Janam Kundali',
  'tool.kundali.text': 'Lagna, rashi, nakshatra, dasha and doshas from your birth details',
  'tool.milan.name': 'Kundali Milan',
  'tool.milan.text': 'Ashtakoot guna milan out of 36, with Manglik and Nadi checks',
  'tool.muhurat.name': 'Shubh Muhurat',
  'tool.muhurat.text': 'Wedding and griha pravesh dates, choghadiya and Rahu kaal',
  'tool.panchang.name': 'Aaj ka Panchang',
  'tool.panchang.text': 'Tithi, nakshatra, vrat and festivals for your city',
  'tool.rashifal.name': 'Rashifal',
  'tool.rashifal.text': 'Daily horoscope for all twelve rashis',
  'tool.free': 'Free',
  'footer.milan': 'Kundali Milan',

  // ── Puja pages: related tools ─────────────────────────────────────────────
  'puja.toolsTitle': 'Plan this puja',
  'puja.milan': 'Match kundalis (36 gunas)',
  'puja.muhuratVivah': 'Find a wedding muhurat',
  'puja.muhuratGriha': 'Find a griha pravesh muhurat',
  'puja.muhuratDay': 'Check today’s choghadiya and Rahu kaal',
  'puja.kundaliNaam': 'Kundali and naamkaran letters for the baby',
  'puja.kundali': 'See the doshas in your kundali',
  'puja.panchang': 'Panchang and sacred days',

  // ── Flows between the tools ───────────────────────────────────────────────
  'flow.milanTitle': 'Next steps for the wedding',
  'flow.milanMuhurat': 'Find a vivah muhurat',
  'flow.milanBook': 'Book a vivah puja',
  'flow.remedyTitle': 'Pujas traditionally done for these doshas',
  'flow.remedyText': 'For guidance only. A pandit ji can read your full kundali and advise whether a puja is needed.',
  'flow.bookDate': 'Book a pandit for this date',
  'flow.bookPandit': 'Book a pandit ji',

  // ── Login-free preview ────────────────────────────────────────────────────
  'preview.kundaliTitle': 'Your kundali at a glance',
  'preview.milanTitle': 'Guna milan at a glance',
  'preview.lagna': 'Lagna (ascendant)',
  'preview.rashi': 'Rashi (Moon sign)',
  'preview.nakshatra': 'Nakshatra',
  'preview.nakshatraValue': '{name}, pada {pada}',
  'preview.manglik': 'Manglik',
  'preview.manglikYes': 'Yes',
  'preview.manglikMild': 'Mild',
  'preview.manglikNo': 'No',
  'preview.chart': 'Lagna chart (D1)',
  'preview.boy': 'Groom',
  'preview.girl': 'Bride',
  'preview.locked':
    'The full report adds the Vimshottari dasha, yogas, all doshas with remedies, divisional charts and a PDF to keep.',
  'preview.lockedMilan':
    'The full report adds Nadi, Bhakoot and Gana dosha with their parihar, both complete kundalis and a PDF to keep.',
  'preview.cta': 'See the full report free — sign in',
  'preview.ctaHint': 'Your details stay filled in; the report opens right after you sign in.',
  'preview.loading': 'Calculating…',
  'preview.error': 'Could not calculate just now. Please check the details and try again.',
  'preview.rateLimited': 'Too many tries from this connection. Please wait a little, or sign in to continue.',
  'preview.submit': 'Show my kundali',
  'preview.submitMilan': 'Show the guna milan',
  'preview.signedOutNote': 'No sign-in needed to see the lagna, rashi and nakshatra. Nothing is saved.',
  'preview.signedOutNoteMilan': 'No sign-in needed to see the guna score. Nothing is saved.',
  'preview.forGuidance': 'For guidance only.',
  'preview.verifyNeeded': 'Please verify your email or mobile number to open the full report.',
  'preview.verifyAction': 'Verify now',

  // ── Sharing ───────────────────────────────────────────────────────────────
  'share.label': 'Share',
  'share.whatsapp': 'WhatsApp',
  'share.copy': 'Copy link',
  'share.copied': 'Link copied',
  'share.native': 'More…',
  'share.image': 'Share as image',
  'share.milanText': '{score}/36 gunas matched in our kundali milan! Match yours free:',
  'share.milanCardTitle': '{score}/36 gunas matched',
  'share.milanCardSub': 'Kundali milan · for guidance only',
  'share.milanCardCta': 'Free kundali milan at',
  'share.muhuratText': 'Shubh {kind} muhurat dates ({place}): {dates}. See all dates free:',
  'share.panchangText': 'Today’s panchang ({date}, {place}): {tithi}, {nakshatra} nakshatra. Full panchang:',
  'share.pujaText': '{name} — book a verified pandit ji:',
  'share.kind.vivah': 'vivah',
  'share.kind.griha_pravesh': 'griha pravesh',

  // ── Push pre-prompt ───────────────────────────────────────────────────────
  'push.title': 'Get reminders for vrat and tyohar',
  'push.text': 'A gentle notification before ekadashi, festivals and your reminders, plus the daily rashifal. You can turn it off any time.',
  'push.accept': 'Turn on reminders',
  'push.later': 'Not now',
  'push.done': 'Reminders are on',
  'push.denied': 'Notifications are blocked in this browser’s settings.',

  // ── Muhurat: server-rendered list ─────────────────────────────────────────
  'muhurat.metaYears': '{from}–{to}',
  'muhurat.upcomingTitle': 'Upcoming vivah muhurat dates',
  'muhurat.upcomingIntro': 'The next wedding muhurat dates for {place} (Indian Standard Time). Choose your own city above for its dates.',
  'muhurat.upcomingNone': 'No vivah muhurat falls in the next three months for {place}.',

  // ── Shared content labels ─────────────────────────────────────────────────
  'faq.title': 'Frequently asked questions',
  'about.title': 'About this tool',

  // ── /kundali content ──────────────────────────────────────────────────────
  'kundali.what.h': 'What is a janam kundali?',
  'kundali.what.p1':
    'A janam kundali (birth chart) is a map of the sky at the exact moment and place of your birth. It shows which rashi was rising in the east — the lagna — and where the Sun, Moon and the other grahas stood among the twelve rashis and twenty-seven nakshatras. Jyotish reads the whole of life from these twelve bhavas (houses).',
  'kundali.what.p2':
    'Families use the kundali for the naamkaran of a newborn, for kundali milan before a wedding, to know the running dasha, and to understand doshas such as Mangal dosha or Kaal Sarp dosha before choosing a remedy puja.',
  'kundali.includes.h': 'What your free kundali includes',
  'kundali.includes.p1':
    'Lagna, rashi and nakshatra with pada; the positions of the nine grahas with their dignity; north and south Indian charts with the navamsa and divisional charts; birth panchang and avakahada chakra; Manglik dosha and other doshas with their parihar; yogas; Vimshottari mahadasha, antardasha and pratyantardasha; Sade Sati; and a PDF in Hindi or English.',
  'kundali.how.h': 'How it is calculated',
  'kundali.how.p1':
    'The chart uses the sidereal zodiac with the Lahiri (Chitrapaksha) ayanamsa, the one used in the Rashtriya Panchang, and whole-sign houses. Graha and lagna positions are checked against Swiss Ephemeris, the reference used by professional jyotish software. The birth time is converted with the time-zone rules that applied at the birth place on that date.',
  'kundali.how.p2':
    'An exact birth time gives an exact lagna: the lagna changes roughly every two hours, and the navamsa every few minutes. If you only know the approximate time, use the closest time you know; the rashi and nakshatra rarely change.',
  'kundali.free.h': 'Is it really free?',
  'kundali.free.p1':
    'Yes. Anyone can see the lagna, rashi, nakshatra and lagna chart without signing in. The full report is free with a free account: {kundali} new kundalis and {milan} kundali milans each month, and a report you have opened can be read and printed again at no cost.',
  'kundali.privacy.h': 'Your birth details stay private',
  'kundali.privacy.p1':
    'The quick preview is calculated and forgotten; nothing is saved. A full report is kept only in your account, never shown to anyone else, and you can remove it whenever you wish. If you choose to share a kundali with a pandit ji for a puja, only that pandit ji can open it.',

  'kundali.faq.free.q': 'Is the janam kundali really free?',
  'kundali.faq.free.a':
    'Yes. The lagna, rashi, nakshatra and lagna chart are shown without signing in. The full report, with dasha, doshas, yogas and a PDF, is free after signing in, up to {kundali} new kundalis a month.',
  'kundali.faq.time.q': 'What if I don’t know the exact birth time?',
  'kundali.faq.time.a':
    'Use the closest time you know. The rashi and nakshatra depend on the Moon and rarely change within a few hours, but the lagna changes about every two hours, so an exact time gives an exact lagna and dasha.',
  'kundali.faq.ayanamsa.q': 'Which ayanamsa and house system do you use?',
  'kundali.faq.ayanamsa.a':
    'Lahiri (Chitrapaksha) ayanamsa, adopted by the Government of India’s Calendar Reform Committee, with whole-sign houses and mean Rahu–Ketu. Positions are checked against Swiss Ephemeris.',
  'kundali.faq.manglik.q': 'How do I know if I am Manglik?',
  'kundali.faq.manglik.a':
    'Mangal dosha is present when Mars sits in the 1st, 2nd, 4th, 7th, 8th or 12th house from the lagna or the Moon. The report shows both, and notes the accepted parihars that soften it, such as Mars in its own or exalted sign.',
  'kundali.faq.language.q': 'Can I get the kundali in Hindi?',
  'kundali.faq.language.a':
    'Yes. Every report can be read and downloaded as a PDF in Hindi or English, and you can switch between them at any time.',
  'kundali.faq.newborn.q': 'Can I make a kundali for a newborn before the naamkaran?',
  'kundali.faq.newborn.a':
    'Yes. Tick “newborn baby” and leave the name empty. The kundali shows the auspicious first letters (namakshar) for the naamkaran sanskar.',
  'kundali.faq.privacy.q': 'Who can see my birth details?',
  'kundali.faq.privacy.a':
    'Only you. The preview is not saved at all, and saved reports stay in your account until you remove them. We never send names or birth details to analytics.',

  // ── /kundali-milan content ────────────────────────────────────────────────
  'milan.what.h': 'What is kundali milan?',
  'milan.what.p1':
    'Kundali milan, or guna milan, compares the birth charts of the bride and groom before marriage. The traditional Ashtakoot method compares the Moon’s rashi and nakshatra in both charts across eight koots, which together carry 36 gunas (points).',
  'milan.koots.h': 'The eight koots and their points',
  'milan.koots.varna': 'Varna — 1 point: spiritual temperament',
  'milan.koots.vashya': 'Vashya — 2 points: mutual attraction and influence',
  'milan.koots.tara': 'Tara — 3 points: birth stars and well-being',
  'milan.koots.yoni': 'Yoni — 4 points: nature and physical harmony',
  'milan.koots.graha_maitri': 'Graha Maitri — 5 points: friendship of the Moon-sign lords',
  'milan.koots.gana': 'Gana — 6 points: deva, manushya or rakshasa nature',
  'milan.koots.bhakoot': 'Bhakoot — 7 points: the relation of the two Moon signs',
  'milan.koots.nadi': 'Nadi — 8 points: constitution and progeny',
  'milan.score.h': 'What does the score mean?',
  'milan.score.p1':
    'Tradition accepts a match of 18 gunas or more. In this report, 33 or more is shown as an excellent match, 25 to 32 as very good, 18 to 24 as acceptable, and below 18 as fewer gunas matching, when many families look at both full charts with a pandit ji before deciding.',
  'milan.doshas.h': 'Nadi, Bhakoot and Manglik dosha',
  'milan.doshas.p1':
    'A zero in Nadi (both share the same nadi) or Bhakoot (the Moon signs stand 2/12, 5/9 or 6/8 apart) is called a dosha. The classics also give parihars — exceptions that cancel it, for example the same rashi with a different nakshatra — and the report shows when one applies.',
  'milan.doshas.p2':
    'Mangal dosha is checked separately for both. When both are Manglik the dosha is considered balanced; when only one is, tradition advises a pandit ji’s guidance.',
  'milan.guidance.h': 'For guidance only',
  'milan.guidance.p1':
    'Guna milan is one traditional view of compatibility. A marriage rests on understanding, shared values and the blessings of elders, so please read the result with a learned pandit ji before any decision.',

  'milan.faq.free.q': 'Is kundali milan free?',
  'milan.faq.free.a':
    'Yes. The guna score out of 36, all eight koots and the Manglik check are shown without signing in. The full report is free after signing in, up to {milan} milans a month.',
  'milan.faq.good.q': 'How many gunas should match for marriage?',
  'milan.faq.good.a':
    'Tradition accepts 18 or more out of 36. A higher score is welcome, but doshas, the Manglik status and the full charts matter as much as the number.',
  'milan.faq.name.q': 'Can kundalis be matched by name alone?',
  'milan.faq.name.a':
    'Name-based matching uses only the first letter and is far less reliable. We match from the date, time and place of birth of both; if a birth time is uncertain, use the closest time you know.',
  'milan.faq.nadi.q': 'What is Nadi dosha, and is it always serious?',
  'milan.faq.nadi.a':
    'Nadi dosha means both share the same nadi, which gives 0 of 8 points. It is cancelled by recognised parihars, such as the same rashi with different nakshatras; the report shows when a parihar applies.',
  'milan.faq.manglik.q': 'What if one partner is Manglik and the other is not?',
  'milan.faq.manglik.a':
    'Tradition advises consulting a pandit ji, who may suggest a Mangal shanti or other remedy. When both are Manglik, the dosha is considered balanced.',
  'milan.faq.privacy.q': 'Are our birth details saved?',
  'milan.faq.privacy.a':
    'Not for the quick score. A full report is saved only in your account, visible to you alone, and you can remove it at any time. The share card shows only the score, never names or birth details.',

  // ── /muhurat content ──────────────────────────────────────────────────────
  'muhurat.what.h': 'What is a shubh muhurat?',
  'muhurat.what.p1':
    'A muhurat is an auspicious window of time chosen from the panchang — the tithi, nakshatra, yoga, vaar and the position of the Sun — so that a new beginning such as a wedding, griha pravesh or other sanskar starts under favourable stars.',
  'muhurat.vivah.h': 'How the wedding dates are chosen',
  'muhurat.vivah.p1':
    'A vivah muhurat needs one of the eleven vivah nakshatras, the Sun in a permitted rashi and a day other than Tuesday or Saturday. Whole periods are left out: Chaturmas, Kharmas, Adhik maas and the times when Guru or Shukra is asta (hidden by the Sun).',
  'muhurat.griha.h': 'Griha pravesh and other occasions',
  'muhurat.griha.p1':
    'Griha pravesh is held by day in Vaishakha, Jyeshtha, Magha or Phalguna, under fixed and gentle nakshatras. Every window shown avoids rikta tithis, amavasya, Bhadra, Rahu kaal, Yamaganda and Gulika kaal, and lasts at least one muhurta of 48 minutes.',
  'muhurat.day.h': 'Choghadiya and Rahu kaal for any day',
  'muhurat.day.p1':
    'For any date you choose, the finder shows the day and night choghadiya, Abhijit muhurat, and the Rahu kaal, Yamaganda and Gulika periods to avoid, worked out from sunrise and sunset in your city.',
  'muhurat.pandit.h': 'Your pandit ji fixes the final muhurat',
  'muhurat.pandit.p1':
    'These dates are for guidance and planning. Your pandit ji fixes the final muhurat, also reading both kundalis, the lagna at the hour and your family’s custom.',

  'muhurat.faq.free.q': 'Is the muhurat finder free?',
  'muhurat.faq.free.a': 'Yes, completely, and no sign-in is needed.',
  'muhurat.faq.city.q': 'Why do muhurat times depend on the city?',
  'muhurat.faq.city.a':
    'Sunrise, sunset and the hour-by-hour panchang differ from city to city, so the same date can have different windows in Delhi and Chennai. Choose your city at the top of the finder.',
  'muhurat.faq.none.q': 'Why are there no wedding dates in some months?',
  'muhurat.faq.none.a':
    'Weddings are traditionally not held during Chaturmas, Kharmas, Adhik maas, or while Guru or Shukra is asta. The finder marks these periods so you can see why a month is empty.',
  'muhurat.faq.choghadiya.q': 'What is choghadiya?',
  'muhurat.faq.choghadiya.a':
    'The day and the night are each divided into eight parts. Amrit, Shubh, Labh and Char are good for beginning work; Udveg, Kaal and Rog are avoided.',
  'muhurat.faq.rahu.q': 'What is Rahu kaal?',
  'muhurat.faq.rahu.a':
    'About an hour and a half each day, ruled by Rahu, during which new work is traditionally not begun. Its time changes with the weekday and with sunrise and sunset.',
  'muhurat.faq.final.q': 'Can I fix my wedding date from this list alone?',
  'muhurat.faq.final.a':
    'Use it to shortlist dates. Your pandit ji fixes the final muhurat after reading both kundalis and the lagna for the ceremony.',
};

export default tools;
