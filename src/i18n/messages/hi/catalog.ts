import type en from '../en/catalog';

// हिन्दी — must define every key in ../en/catalog.ts (tsc enforces it).
const catalog: Record<keyof typeof en, string> = {
  'meta.pujas.title': 'पूजाएँ',
  'meta.pujas.description':
    'गृह प्रवेश, सत्यनारायण कथा, रुद्राभिषेक और अनेक पावन पूजाएँ — सत्यापित पंडित जी के साथ, घर पर या ऑनलाइन लाइव।',

  'category.all': 'सभी',
  'category.sanskar': 'संस्कार',
  'category.sanskar.blurb': 'नामकरण से विवाह तक, जीवन के हर पड़ाव के संस्कार।',
  'category.griha': 'गृह एवं वास्तु',
  'category.griha.blurb': 'नए घर या भूमि के लिए शुभ आशीर्वाद।',
  'category.shanti': 'शांति एवं दोष निवारण',
  'category.shanti.blurb': 'ग्रहों की शांति और दोषों का निवारण।',
  'category.path': 'पाठ एवं कथा',
  'category.path.blurb': 'पावन पाठ और कथाएँ।',
  'category.festival': 'त्योहार',
  'category.festival.blurb': 'त्योहारों की पूजा, पूरे विधि-विधान से।',
  'category.abhishek': 'अभिषेक एवं जाप',
  'category.abhishek.blurb': 'अभिषेक, जाप और हवन।',

  'browse.title': 'हर पावन अवसर के लिए पूजा',
  'browse.description':
    'बच्चे के नामकरण से लेकर नए घर के गृह प्रवेश तक — पूजा चुनिए, फिर अपने पास के सत्यापित पंडित जी खोजिए या ऑनलाइन लाइव पूजा बुक कीजिए।',
  'browse.searchLabel': 'नाम या देवता से पूजा खोजें',
  'browse.searchPlaceholder': 'पूजा या देवता खोजें, जैसे शिव',
  'browse.clearSearch': 'खोज साफ़ करें',
  'browse.filterLabel': 'श्रेणी के अनुसार देखें',
  'browse.loadError': 'पूजाओं की सूची लोड नहीं हो सकी',
  'browse.noMatch': '“{q}” से मेल खाती कोई पूजा नहीं मिली',
  'browse.noneInCategory': 'इस श्रेणी में अभी कोई पूजा नहीं है',
  'browse.showAll': 'सभी पूजाएँ देखें',
  'browse.emptyHint':
    'कोई दूसरा नाम या देवता खोजकर देखिए — या पंडित जी को अपनी आवश्यकता बताइए; अधिकतर अनुष्ठानों की व्यवस्था हो जाती है।',
  'browse.featured': 'प्रमुख पूजाएँ',
  'browse.more': 'और पूजाएँ',
  'browse.unsure': 'तय नहीं कर पा रहे कि आपके अवसर के लिए कौन-सी पूजा उचित है?',
  'browse.askPandit': 'अपने पास के पंडित जी से पूछिए',

  'tile.joiningSoon': 'पंडित जी जल्द जुड़ रहे हैं',
  'tile.from': '{price} से आरंभ',
  'tile.alsoOnline': 'ऑनलाइन भी',
  'tile.forDeity': '{deity} को समर्पित',
  'tile.about': 'लगभग {duration}',
  'tile.view': 'पूजा देखें',

  'detail.loading': 'पूजा का विवरण खुल रहा है…',
  'detail.notFound': 'यह पूजा नहीं मिली',
  'detail.loadError': 'यह पूजा लोड नहीं हो सकी',
  'detail.notFoundHint': 'हो सकता है इसका नाम बदल गया हो या इसे सूची से हटा दिया गया हो।',
  'detail.exploreAll': 'सभी पूजाएँ देखें',
  'detail.back': 'सभी पूजाएँ',
  'detail.offeredTo': '{deity} को अर्पित',
  'detail.about': 'इस पूजा के बारे में',
  'detail.why': 'यह पूजा क्यों की जाती है',
  'detail.samagri': 'सामग्री',
  'detail.samagriHint': 'अनुष्ठान में लगने वाली पूजन सामग्री। अंतिम सूची पंडित जी स्वयं बताएँगे।',
  'detail.bookAside': 'यह पूजा बुक करें',
  'detail.dakshinaFrom': 'आरंभिक दक्षिणा',
  'detail.duration': 'सामान्य अवधि',
  'detail.panditCount_one': '{count} सत्यापित पंडित जी यह पूजा कराते हैं',
  'detail.panditCount_other': '{count} सत्यापित पंडित जी यह पूजा कराते हैं',
  'detail.findNear': 'पास के पंडित जी खोजें',
  'detail.bookOnline': 'संकल्प के साथ ऑनलाइन बुक करें',
  'detail.onlineNote':
    'ऑनलाइन पूजा में पंडित जी वीडियो पर लाइव पूजा करते हैं और आपके परिवार का संकल्प — यानी पूजा का विधिवत उद्देश्य — नाम और गोत्र सहित लेते हैं।',
};

export default catalog;
