import type en from '../en/nav';

// हिन्दी — must define every key in ../en/nav.ts (tsc enforces it).
const nav: Record<keyof typeof en, string> = {
  'meta.title': 'पूजा सेवक — हर पावन अवसर के लिए सत्यापित पंडित जी',
  'meta.description':
    'गृह प्रवेश, सत्यनारायण कथा, रुद्राभिषेक और अन्य अनुष्ठानों के लिए सत्यापित पंडित जी बुक करें — अपने घर पर, या दुनिया में कहीं से भी लाइव ऑनलाइन।',
  'aria.main': 'मुख्य',
  'link.home': 'होम',
  'link.pujas': 'पूजाएँ',
  'link.browse': 'पंडित जी खोजें',
  'link.online': 'ऑनलाइन पूजा',
  'link.panchang': 'पंचांग',
  'link.reminders': 'स्मरण',
  'link.myBookings': 'मेरी बुकिंग',
  'link.panditBookings': 'बुकिंग',
  'link.panditServices': 'मेरी पूजाएँ',
  'link.panditProfile': 'प्रोफ़ाइल',
  'link.admin': 'एडमिन कंसोल',
  'link.dashboard': 'डैशबोर्ड',
  'link.contact': 'संपर्क',
  'link.account': 'खाता',
  'account.aria': 'आपका खाता, {name}',
  'menu.open': 'मेन्यू खोलें',
  'menu.title': 'मेन्यू',
  'menu.signedInAs': '{name} के रूप में साइन इन हैं',
  'menu.language': 'भाषा',

  'footer.aria': 'फ़ुटर',
  'footer.about':
    'हर पावन अवसर के लिए सत्यापित पंडित जी — आपके घर पर, या दुनिया में कहीं भी बसे परिवारों के लिए लाइव ऑनलाइन।',
  'footer.blessingMeaning': 'सभी प्राणी सुखी रहें।',
  'footer.book': 'बुक करें',
  'footer.allPujas': 'सभी पूजाएँ',
  'footer.pandits': 'आपके पास के पंडित जी',
  'footer.online': 'प्रवासी भारतीयों के लिए ऑनलाइन पूजा',
  'footer.panchang': 'पंचांग',
  'footer.forPandits': 'पंडित जी के लिए',
  'footer.joinPandit': 'पंडित के रूप में जुड़ें',
  'footer.panditSignIn': 'पंडित जी साइन इन करें',
  'footer.yourAccount': 'आपका खाता',
  'footer.myBookings': 'मेरी बुकिंग',
  'footer.reminders': 'स्मरण',
  'footer.addresses': 'सहेजे गए पते',
  'footer.dashboard': 'डैशबोर्ड',
  'footer.company': 'पूजा सेवक',
  'footer.aboutUs': 'हमारे बारे में',
  'footer.contact': 'संपर्क करें',
  'footer.faq': 'प्रश्नोत्तर',
  'footer.legal': 'नीतियाँ',
  'footer.terms': 'सेवा की शर्तें',
  'footer.privacy': 'गोपनीयता नीति',
  'footer.refund': 'रद्दीकरण और रिफ़ंड',
  'footer.copyright':
    '© {year} पूजा सेवक। अनुष्ठान पंडित जी की परंपरा के अनुसार किए जाते हैं; रीति-रिवाज क्षेत्र और परिवार के अनुसार अलग हो सकते हैं।',
};

export default nav;
