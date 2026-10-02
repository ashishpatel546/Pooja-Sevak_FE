import type en from '../en/samagri';

// हिन्दी — must define every key in ../en/samagri.ts (tsc enforces it).
const samagri: Record<keyof typeof en, string> = {
  // Viewer
  'viewer.title': 'पूजा सामग्री सूची',
  'viewer.open': 'सामग्री सूची देखें',
  'viewer.pages_one': '{count} पृष्ठ',
  'viewer.pages_other': '{count} पृष्ठ',
  'viewer.pageAlt': '{title} की सामग्री सूची, पृष्ठ {page} / {total}',
  'viewer.listAlt': '{title} की सामग्री सूची',
  'viewer.loading': 'सूची खुल रही है…',
  'viewer.loadingPage': 'पृष्ठ {page} / {total} खुल रहा है…',
  'viewer.error': 'सूची यहाँ नहीं दिखाई जा सकी।',
  'viewer.openNewTab': 'नए टैब में खोलें',
  'viewer.updated': '{date} को अपडेट की गई',
  'viewer.none': 'पंडित जी ने इस पूजा की सामग्री सूची अभी नहीं दी है।',
  'viewer.genericNote':
    'पंडित जी ने अपनी सूची अभी अपलोड नहीं की है। इस पूजा में आम तौर पर लगने वाली सामग्री नीचे है — कृपया पंडित जी से एक बार पुष्टि कर लें।',
  'viewer.zoomHint': 'फ़ोन पर दो उँगलियों से ज़ूम कर सकते हैं।',
  // पूर्ण / संक्षिप्त विधि
  'mode.fullList': 'पूर्ण विधि की सूची',
  'mode.lighterList': 'संक्षिप्त विधि की सूची',
  'mode.fallbackNote':
    'पंडित जी ने संक्षिप्त विधि की अलग सूची अभी नहीं दी है — यह पूर्ण विधि की सूची है।',

  // Service dialog (pandit)
  'svc.list.label': 'पूजा सामग्री सूची (ज़रूरी)',
  'svc.list.hint':
    'PDF (अधिकतम 20 पृष्ठ) या अपनी सूची की साफ़ फ़ोटो — अधिकतम 10 MB। भक्त बुकिंग से पहले इसे ऐप में ही देख सकेंगे।',
  'svc.list.choose': 'फ़ाइल चुनें',
  'svc.list.replace': 'सूची बदलें',
  'svc.list.view': 'देखें',
  'svc.list.selected': 'चुनी गई फ़ाइल: {name}',
  'svc.list.currentPdf_one': 'अभी की सूची: PDF, {count} पृष्ठ',
  'svc.list.currentPdf_other': 'अभी की सूची: PDF, {count} पृष्ठ',
  'svc.list.currentImage': 'अभी की सूची: फ़ोटो',
  'svc.list.uploading': 'सूची अपलोड हो रही है…',
  'svc.list.fullLabel': 'पूर्ण विधि की सामग्री सूची (ज़रूरी)',
  'svc.lighterList.label': 'संक्षिप्त विधि की सामग्री सूची (ज़रूरी)',
  'svc.lighterList.hint':
    'संक्षिप्त विधि में सामग्री अक्सर कम लगती है, इसलिए उसकी अलग सूची दें। PDF (अधिकतम 20 पृष्ठ) या साफ़ फ़ोटो — अधिकतम 10 MB।',
  'svc.lighterList.missing': 'संक्षिप्त विधि की सामग्री सूची अपलोड करें',
  'svc.kit.title': 'परिवार चाहे तो मैं सारी पूजा सामग्री ला सकता हूँ',
  'svc.kit.hint':
    'यह केवल एक विकल्प है — हर बुकिंग पर परिवार स्वयं तय करेगा कि सामग्री आपसे मँगवानी है या ख़ुद व्यवस्था करनी है। घर पर होने वाली पूजा में ही उपलब्ध। यह राशि पूरी की पूरी आपको मिलती है — इस पर कोई कमीशन नहीं कटता।',
  'svc.kit.price': 'सामग्री का शुल्क (₹)',
  'svc.kit.priceHint': 'आपकी सूची की पूरी सामग्री के लिए। बदलाव केवल नई बुकिंग पर लागू होगा।',
  'svc.kit.pricePlaceholder': 'जैसे 1500',
  'svc.kit.fullPrice': 'पूर्ण विधि की सामग्री का शुल्क (₹)',
  'svc.kit.lighterPrice': 'संक्षिप्त विधि की सामग्री का शुल्क (₹)',
  'svc.kit.lighterPriceHint': 'संक्षिप्त विधि की सूची की पूरी सामग्री के लिए। बदलाव केवल नई बुकिंग पर लागू होगा।',
  'svc.kit.lighterPricePlaceholder': 'जैसे 900',
  'svc.err.listRequired': 'कृपया अपनी सामग्री सूची अपलोड करें — पूजा जोड़ने के लिए यह ज़रूरी है।',
  'svc.err.listType': 'कृपया PDF या फ़ोटो (JPEG, PNG, WebP या HEIC) अपलोड करें।',
  'svc.err.listSize': 'फ़ाइल 10 MB से बड़ी है। कृपया छोटी फ़ाइल चुनें।',
  'svc.err.listPages': 'PDF में 20 से ज़्यादा पृष्ठ हैं। कृपया छोटी सूची अपलोड करें।',
  'svc.err.listEncrypted': 'यह PDF पासवर्ड से सुरक्षित है। कृपया बिना पासवर्ड वाली PDF अपलोड करें।',
  'svc.err.listPdf': 'यह PDF खुल नहीं सकी। कृपया दूसरी PDF या सूची की फ़ोटो अपलोड करें।',
  'svc.err.listImage': 'यह फ़ोटो पढ़ी नहीं जा सकी। कृपया ज़्यादा साफ़ फ़ोटो चुनें।',
  'svc.err.listUnavailable': 'अभी अपलोड नहीं हो पा रहा है। कृपया थोड़ी देर बाद फिर कोशिश करें।',
  'svc.err.kitPrice': 'सामग्री का शुल्क ₹1 से ₹1,00,000 के बीच लिखें।',
  'svc.err.lighterListRequired': 'संक्षिप्त विधि की सामग्री सूची भी अपलोड करें — संक्षिप्त विधि देने के लिए यह ज़रूरी है।',
  'svc.err.lighterKitPrice': 'संक्षिप्त विधि की सामग्री का शुल्क ₹1 से ₹1,00,000 के बीच लिखें।',

  // Pandit services page
  'services.listPdf_one': 'सामग्री सूची: PDF, {count} पृष्ठ',
  'services.listPdf_other': 'सामग्री सूची: PDF, {count} पृष्ठ',
  'services.listImage': 'सामग्री सूची: फ़ोटो',
  'services.listMissing': 'सामग्री सूची अपलोड करें — ज़रूरी',
  'services.listUpload': 'सूची अपलोड करें',
  'services.fullListPdf_one': 'पूर्ण विधि की सूची: PDF, {count} पृष्ठ',
  'services.fullListPdf_other': 'पूर्ण विधि की सूची: PDF, {count} पृष्ठ',
  'services.fullListImage': 'पूर्ण विधि की सूची: फ़ोटो',
  'services.lighterListPdf_one': 'संक्षिप्त विधि की सूची: PDF, {count} पृष्ठ',
  'services.lighterListPdf_other': 'संक्षिप्त विधि की सूची: PDF, {count} पृष्ठ',
  'services.lighterListImage': 'संक्षिप्त विधि की सूची: फ़ोटो',
  'services.lighterListMissing': 'संक्षिप्त विधि की सामग्री सूची अपलोड करें',
  'services.lighterKitLine': 'संक्षिप्त विधि की सामग्री · {price}',
  'services.lighterMissingBanner_one':
    'आपकी {count} पूजा में संक्षिप्त विधि की अलग सामग्री सूची नहीं है। अभी भक्तों को पूर्ण विधि की सूची दिख रही है — कृपया संक्षिप्त विधि की सूची अपलोड करें।',
  'services.lighterMissingBanner_other':
    'आपकी {count} पूजाओं में संक्षिप्त विधि की अलग सामग्री सूची नहीं है। अभी भक्तों को पूर्ण विधि की सूची दिख रही है — कृपया संक्षिप्त विधि की सूचियाँ अपलोड करें।',
  'services.kitLine': 'परिवार चाहे तो सामग्री आप लाएँगे · {price}',
  'services.missingBanner_one':
    'आपकी {count} पूजा की सामग्री सूची अभी बाकी है। भक्त नहीं देख पा रहे कि क्या तैयारी करनी है — कृपया सूची अपलोड करें।',
  'services.missingBanner_other':
    'आपकी {count} पूजाओं की सामग्री सूची अभी बाकी है। भक्त नहीं देख पा रहे कि क्या तैयारी करनी है — कृपया सूचियाँ अपलोड करें।',

  // Public profile
  'profile.kit': 'पंडित जी सारी सामग्री ला सकते हैं · {price} (घर पर पूजा के लिए)',
  'profile.kitBoth':
    'पंडित जी सारी सामग्री ला सकते हैं · पूर्ण विधि {full}, संक्षिप्त विधि {lighter} (घर पर पूजा के लिए)',

  // Booking wizard (family)
  'book.title': 'पूजा सामग्री',
  'book.choice.legend': 'सामग्री की व्यवस्था कौन करेगा?',
  'book.choice.family': 'हम स्वयं व्यवस्था करेंगे',
  'book.choice.familyHint': 'पंडित जी की सूची देखकर सामग्री आप ख़ुद ले आएँ — कोई अतिरिक्त शुल्क नहीं।',
  'book.kit.label': 'पूजा सामग्री पंडित जी से मँगवाएँ — {price}',
  'book.kit.hint': 'पंडित जी अपनी सूची की सारी सामग्री साथ लाएँगे, आपको कुछ ख़रीदना नहीं पड़ेगा।',
  'book.family': 'नहीं तो सामग्री की व्यवस्था आपका परिवार पंडित जी की सूची के अनुसार करेगा।',
  'book.onlineNote': 'ऑनलाइन पूजा में सामग्री की व्यवस्था आपका परिवार करता है।',
  'book.viewList': 'सूची देखें',

  // Money lines
  'price.samagriNote': 'बुकिंग रद्द होने पर सामग्री की राशि भी पूरी लौटा दी जाती है। पूजा संपन्न होने पर यह राशि पूरी पंडित जी को जाती है।',
  'price.samagri': 'पूजा सामग्री (पंडित जी लाएँगे)',

  // Who arranges it
  'by.pandit': 'सामग्री: पंडित जी लाएँगे',
  'by.family': 'सामग्री: परिवार व्यवस्था करेगा',
  'by.panditForPandit': 'सामग्री: आप (पंडित जी) लाएँगे — {price}',
  'by.familyForPandit': 'सामग्री: परिवार व्यवस्था करेगा',
  'by.panditForPanditHint': 'परिवार ने सामग्री का भुगतान कर दिया है। कृपया अपनी सूची की सारी सामग्री साथ लेकर जाएँ।',
  'by.viewMyList': 'मेरी सूची देखें',
  'by.prepareHint': 'कृपया पूजा से पहले पंडित जी की सूची की सारी सामग्री तैयार रखें।',
  'by.listLink': 'सामग्री सूची देखें',

  // Pandit booking card money
  'pandit.samagriLine': 'पूजा सामग्री (आप लाएँगे, कोई कमीशन नहीं)',
  'pandit.samagriNote': 'सामग्री की राशि पूरी आपको मिलती है। बुकिंग रद्द होने पर यह परिवार को लौटा दी जाती है।',

  // Dashboard checklist
  'checklist.lists': 'हर पूजा की सामग्री सूची अपलोड करें',
  'checklist.listsHint_one': '{count} पूजा की सूची बाकी है।',
  'checklist.listsHint_other': '{count} पूजाओं की सूची बाकी है।',

  // Earnings / admin
  'earnings.samagri': 'आपकी लाई सामग्री',
  'admin.samagri': 'सामग्री (पंडित जी को)',
  'admin.payout': 'भुगतान',
  'admin.inclSamagri': 'सामग्री {amount} सहित',
};

export default samagri;
