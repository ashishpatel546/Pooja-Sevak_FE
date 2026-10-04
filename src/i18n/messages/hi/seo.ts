import type en from '../en/seo';

// हिन्दी — must define every key in ../en/seo.ts (tsc enforces it).
const seo: Record<keyof typeof en, string> = {
  'home.title': 'पूजा सेवक — घर पर और ऑनलाइन पूजा के लिए सत्यापित पंडित जी',
  'breadcrumb.home': 'मुख्य पृष्ठ',
  'breadcrumb.pujas': 'पूजाएँ',
  'puja.title': '{name} — घर पर सत्यापित पंडित जी बुक करें',
  'puja.titleOnline': '{name} — ऑनलाइन या घर पर सत्यापित पंडित जी बुक करें',
  'puja.searchName': '{name} पूजा',
  'puja.description':
    'अपने घर पर या ऑनलाइन {name} के लिए सत्यापित पंडित जी बुक करें। दक्षिणा, अवधि और सामग्री की सूची देखें।',
  'puja.descriptionPrice':
    'अपने घर पर या ऑनलाइन {name} के लिए सत्यापित पंडित जी बुक करें। दक्षिणा {price} से। अवधि और सामग्री की सूची देखें।',
  'pandit.title': '{name} — {city} में पंडित जी',
  'pandit.titleNoCity': '{name} — सत्यापित पंडित जी',
  'pandit.description':
    '{name} की पूजाएँ, दक्षिणा और समीक्षाएँ देखें, और पूजा सेवक पर घर पर या ऑनलाइन पूजा बुक करें।',
  'og.alt': 'पूजा सेवक — घर पर और ऑनलाइन पूजा के लिए सत्यापित पंडित जी',
  'org.areaServed': 'भारत',
  'book.title': 'पूजा बुक करें',
  'language.label': 'यह पृष्ठ पढ़ें',
};

export default seo;
