import type en from '../en/rashifal';

// हिन्दी — must define every key in ../en/rashifal.ts (tsc enforces it).
const rashifal: Record<keyof typeof en, string> = {
  'meta.title': 'आज का राशिफल {date} — सभी 12 राशियों का दैनिक राशिफल',
  'meta.description':
    'मेष से मीन तक का दैनिक राशिफल, आज की ग्रह स्थिति (गोचर, लाहिड़ी अयनांश) से निकाला गया: काम, धन, परिवार, स्वास्थ्य, शुभ रंग और सरल उपाय। मुफ़्त, हिन्दी और अंग्रेज़ी में।',
  'sign.metaTitle': 'आज का राशिफल — {sign} राशि {date}',
  'sign.metaDescription':
    '{date} का {sign} राशिफल: काम, धन, परिवार और स्वास्थ्य के लिए दिन कैसा है, साढ़ेसाती की स्थिति, शुभ रंग और अंक, और परंपरागत उपाय — आज के गोचर से।',
  'breadcrumb.rashifal': 'राशिफल',

  'hero.invocation': '॥ श्री गणेशाय नमः ॥',
  'hero.title': 'आज का राशिफल',
  'hero.intro':
    'बारहों राशियों के लिए आज का दिन, ग्रहों की आज की स्थिति (गोचर) से — पंचांग की परंपरा के अनुसार आपकी चंद्र राशि से गिनकर।',
  'panchang.line': '{weekday} · {tithi} · {nakshatra} नक्षत्र · चंद्रमा {moon} राशि में',
  'panchang.link': 'आज का पंचांग',

  'grid.title': 'अपनी राशि चुनें',
  'grid.read': '{sign} राशिफल पूरा पढ़ें',
  'grid.yours': 'आपकी राशि',
  'rating.aria': 'दिन का संकेत: 5 में से {rating}',

  'shani.sade_sati_rising': 'साढ़ेसाती · पहला चरण',
  'shani.sade_sati_peak': 'साढ़ेसाती · दूसरा चरण',
  'shani.sade_sati_setting': 'साढ़ेसाती · तीसरा चरण',
  'shani.dhaiya_kantak': 'शनि की ढैय्या',
  'shani.dhaiya_ashtam': 'शनि की ढैय्या',

  'mine.label': 'मेरी राशि',
  'mine.choose': 'चुनें…',
  'mine.clear': 'हटाएँ',
  'mine.fromKundali': 'आपकी कुंडली ({name}) के अनुसार',
  'mine.fromPreference': 'आपकी स्मरण सेटिंग से',
  'mine.fromDevice': 'इस डिवाइस पर याद रखी गई',
  'mine.unknown': 'अपनी राशि पक्की नहीं पता? चंद्र राशि जन्म की तिथि, समय और स्थान से निकलती है।',
  'mine.makeKundali': 'मुफ़्त कुंडली से जानें',
  'mine.this': 'यह आपकी राशि है',
  'mine.setThis': 'इसे मेरी राशि रखें',

  'sign.title': '{sign} राशिफल',
  'sign.dayNav': 'दिन चुनें',
  'day.yesterday': 'बीता कल',
  'day.today': 'आज',
  'day.tomorrow': 'आने वाला कल',
  'sign.moon': 'चंद्रमा आपकी राशि से {house} भाव में ({sign})',
  'section.overall': 'आज का दिन',
  'section.career': 'काम और करियर',
  'section.money': 'धन',
  'section.love': 'परिवार और संबंध',
  'section.health': 'स्वास्थ्य और ऊर्जा',
  'section.outlook': 'आगे का संकेत (गुरु, शनि, राहु)',
  'section.remedy': 'आज का उपाय',
  'section.lucky': 'शुभ रंग और अंक',
  'lucky.colour': 'रंग',
  'lucky.number': 'अंक',
  'section.shani': '{sign} राशि पर शनि',
  'section.gochar': '{sign} राशि से आज का गोचर',
  'gochar.graha': 'ग्रह',
  'gochar.sign': 'राशि',
  'gochar.house': 'भाव',
  'gochar.effect': 'फल',
  'gochar.good': 'अनुकूल',
  'gochar.mixed': 'कम अनुकूल',
  'gochar.retro': 'वक्री',

  'week.title': 'अगले सात दिन',
  'week.best': 'नए काम के लिए बेहतर दिन',
  'week.none': 'इस सप्ताह चंद्रमा का कोई स्पष्ट अनुकूल दिन नहीं — योजनाएँ स्थिर रखें।',

  'links.title': 'और जानें',
  'links.kundali': 'अपनी सही राशि जानें',
  'links.kundaliText': 'मुफ़्त जन्म कुंडली से चंद्र राशि, लग्न और दशा जानें।',
  'links.panchang': 'आज का पंचांग',
  'links.panchangText': 'तिथि, नक्षत्र, राहु काल और आज के व्रत-त्योहार।',
  'links.shani': 'शनि शांति पूजा बुक करें',
  'links.shaniText': 'साढ़ेसाती या ढैय्या में बहुत से परिवार शनि शांति पूजा कराते हैं।',
  'links.remind': 'हर सुबह अपना राशिफल पाएँ',
  'links.remindText': 'स्मरण में दैनिक राशिफल चालू करें — सुबह 6 बजे सूचना।',
  'links.muhurat': 'शुभ मुहूर्त देखें',
  'links.muhuratText': 'विवाह, गृह प्रवेश, मुंडन, वाहन ख़रीद और अन्य कार्यों की तिथियाँ।',

  'other.title': 'अन्य राशियाँ',
  'note.disclaimer':
    'राशिफल सामान्य मार्गदर्शन है। स्वास्थ्य, धन या क़ानूनी फ़ैसलों के लिए योग्य विशेषज्ञ की सलाह लें।',
  'error.unavailable': 'अभी आज का राशिफल नहीं मिल पाया। कृपया थोड़ी देर बाद फिर देखें।',
};

export default rashifal;
