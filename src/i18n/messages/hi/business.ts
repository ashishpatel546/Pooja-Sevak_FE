import type en from '../en/business';

// हिन्दी — must define every key in ../en/business.ts (tsc enforces it).
const business: Record<keyof typeof en, string> = {
  // सार्वजनिक पेज
  'public.phone': 'फ़ोन',

  // एडमिन फ़ॉर्म
  title: 'व्यावसायिक विवरण',
  desc: 'संपर्क, नियम व शर्तें, गोपनीयता और रिफ़ंड नीति के पेजों पर और सर्च नतीजों में दिखता है। खाली छोड़े गए विवरण साइट पर नहीं दिखते।',
  loadError: 'व्यावसायिक विवरण लोड नहीं हो सका',
  'lang.en': 'English',
  'lang.hi': 'हिन्दी',
  optional: 'वैकल्पिक',
  save: 'व्यावसायिक विवरण सहेजें',
  saved: 'व्यावसायिक विवरण सहेज लिया गया। सार्वजनिक पेजों पर अब यही दिखेगा।',
  savedStale: 'व्यावसायिक विवरण सहेज लिया गया। सार्वजनिक पेजों पर यह 5 मिनट के भीतर दिखने लगेगा।',
  fixErrors: 'कृपया चिह्नित विवरण ठीक करें।',
  unsaved: 'कुछ बदलाव अभी सहेजे नहीं गए हैं।',

  'group.identity': 'व्यवसाय की पहचान',
  'group.identity.desc': 'आपका पंजीकृत नाम, पता और कर संबंधी विवरण।',
  'group.support': 'सहायता',
  'group.support.desc': 'परिवार आपसे कैसे संपर्क करें। संपर्क पेज पर दिखता है।',
  'group.grievance': 'शिकायत अधिकारी',
  'group.grievance.desc': 'आईटी नियम 2021 और DPDP अधिनियम 2023 के तहत ज़रूरी। गोपनीयता नीति में दिखता है।',
  'group.legal': 'कानूनी',
  'group.legal.desc': 'नियम व शर्तों में और हर कानूनी पेज पर उपयोग होता है।',

  'field.legalName': 'पंजीकृत व्यावसायिक नाम',
  'field.legalName.hint': 'कानूनी संस्था या प्रोपराइटर का नाम। संपर्क पेज के पते में और कानूनी पेजों पर दिखता है।',
  'field.gstin': 'GSTIN',
  'field.gstin.hint': '15 अक्षर, जैसे 09ABCDE1234F1Z5। संपर्क पेज पर पते के नीचे दिखता है।',
  'field.address': 'डाक पता',
  'field.address.hint': 'हर पंक्ति अलग लाइन में लिखें। संपर्क पेज और गोपनीयता नीति में दिखता है।',
  'field.supportEmail': 'सहायता ईमेल',
  'field.supportEmail.hint': 'हर जानकारी और कानूनी पेज पर दिखता है।',
  'field.supportPhone': 'सहायता फ़ोन',
  'field.supportPhone.hint': 'जैसे +91 98765 43210। संपर्क पेज पर दिखता है।',
  'field.supportHours': 'सहायता का समय',
  'field.supportHours.hint': 'फ़ोन नंबर के नीचे दिखता है, जैसे सुबह 10 से शाम 7 बजे, सोम–शनि।',
  'field.responseHours': 'पहला उत्तर कितने घंटों में',
  'field.responseHours.hint': 'संपर्क पेज पर वादा: “हम आमतौर पर … घंटों में उत्तर देते हैं”।',
  'field.officerName': 'नाम',
  'field.officerName.hint': 'गोपनीयता नीति में दिखता है।',
  'field.officerEmail': 'ईमेल',
  'field.officerEmail.hint': 'खाली छोड़ें तो सहायता ईमेल उपयोग होगा।',
  'field.officerPhone': 'फ़ोन',
  'field.officerPhone.hint': 'गोपनीयता नीति में दिखता है।',
  'field.city': 'न्यायिक क्षेत्र का शहर',
  'field.city.hint':
    'इस शहर के न्यायालयों का क्षेत्राधिकार होगा (नियम व शर्तें → लागू कानून)। खाली छोड़ें तो यह वाक्य नहीं दिखेगा।',
  'field.updated': '“अंतिम अद्यतन” की तारीख़',
  'field.updated.hint': 'नियम व शर्तें, गोपनीयता और रिफ़ंड नीति के ऊपर दिखती है। इनका पाठ बदलें तो यह तारीख़ भी बदलें।',

  'err.required': 'यह भरना ज़रूरी है।',
  'err.tooLong': '{max} अक्षरों से कम रखें।',
  'err.email': 'सही ईमेल पता लिखें।',
  'err.phone': '10–13 अंकों का फ़ोन नंबर लिखें, जैसे +91 98765 43210।',
  'err.gstin': 'सही 15 अक्षरों का GSTIN लिखें, जैसे 09ABCDE1234F1Z5।',
  'err.hours': '1 से 720 के बीच पूरे घंटे लिखें।',
  'err.date': 'सही तारीख़ चुनें।',
};

export default business;
