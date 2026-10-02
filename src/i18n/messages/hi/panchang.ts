import type en from '../en/panchang';

// हिन्दी — must define every key in ../en/panchang.ts (tsc enforces it).
const panchang: Record<keyof typeof en, string> = {
  'meta.title': 'पंचांग और पावन दिन',
  'meta.description':
    'आपके शहर के लिए आज की तिथि, पक्ष, नक्षत्र, सूर्योदय और सूर्यास्त, साथ में अगले तीन महीनों की पूर्णिमा, एकादशी, प्रदोष और अन्य पावन तिथियाँ।',
  loading: 'पंचांग देखा जा रहा है…',

  'hero.title': '{date} का पंचांग · {place}',
  'hero.monthLine': '{month} मास, {paksha} पक्ष · अमांत पंचांग',
  'hero.nakshatra': 'नक्षत्र',
  'hero.sunrise': 'सूर्योदय',
  'hero.sunset': 'सूर्यास्त',
  'hero.todayIs': 'आज के पर्व',
  'hero.footnote': '{place} के सूर्योदय के अनुसार गणना। सभी समय {zone} में हैं।',
  'hero.zoneIst': 'भारतीय समय (IST)',
  'hero.zoneLocal': '{place} के स्थानीय समय ({zone})',
  'hero.moonLabel': '{tithi} का चंद्रमा, लगभग {percent}% प्रकाशित',
  'hero.unavailableTitle': 'आज का पंचांग अभी नहीं खुल सका',
  'hero.unavailableText':
    'हमारे पंचांग से अभी उत्तर नहीं मिला। एक मिनट बाद पेज फिर से खोलें — नीचे के पावन दिन शायद अब भी दिख रहे हों।',
  'hero.reload': 'पंचांग फिर से खोलें',

  'line.full': '{month} {paksha} {tithi}',
  'line.monthTithi': '{month} {tithi}',
  'line.pakshaTithi': '{paksha} {tithi}',

  'paksha.shukla': 'शुक्ल',
  'paksha.krishna': 'कृष्ण',

  'tithi.1': 'प्रतिपदा',
  'tithi.2': 'द्वितीया',
  'tithi.3': 'तृतीया',
  'tithi.4': 'चतुर्थी',
  'tithi.5': 'पंचमी',
  'tithi.6': 'षष्ठी',
  'tithi.7': 'सप्तमी',
  'tithi.8': 'अष्टमी',
  'tithi.9': 'नवमी',
  'tithi.10': 'दशमी',
  'tithi.11': 'एकादशी',
  'tithi.12': 'द्वादशी',
  'tithi.13': 'त्रयोदशी',
  'tithi.14': 'चतुर्दशी',
  'tithi.15': 'पूर्णिमा',
  'tithi.30': 'अमावस्या',

  'type.purnima': 'पूर्णिमा',
  'type.amavasya': 'अमावस्या',
  'type.ekadashi': 'एकादशी',
  'type.pradosh': 'प्रदोष',
  'type.sankashti': 'संकष्टी',
  'type.masik_shivratri': 'मासिक शिवरात्रि',
  'type.sankranti': 'संक्रांति',
  'type.pitru_paksha': 'पितृ पक्ष',
  'type.sarva_pitru_amavasya': 'सर्व पितृ अमावस्या',

  'list.all': 'सभी',
  'list.filterLabel': 'एक तरह के पावन दिन दिखाएँ',
  'list.noneOfType': 'अगले तीन महीनों में ऐसा कोई दिन नहीं है।',
  'list.ongoing': 'चल रहा है',
  'list.remind': 'मुझे याद दिलाएँ',
  'list.remindAria': 'हर {name} से पहले मुझे याद दिलाएँ',
  'list.suggested': 'इस दिन की पूजा:',

  'pitru.title': 'पितृ पक्ष — पूर्वजों का पखवाड़ा',
  'pitru.range': '{from} – {to}',
  'pitru.endsIn_one': '{count} दिन शेष',
  'pitru.endsIn_other': '{count} दिन शेष',
  'pitru.endsToday': 'आज अंतिम दिन है',
  'pitru.what':
    'नवरात्रि से पहले के सोलह दिनों में परिवार जल, तिल और अन्न से अपनी तीन पीढ़ियों के पूर्वजों का स्मरण करते हैं। मान्यता है कि इन दिनों वे हमारे निकट होते हैं, और श्रद्धा से दिया गया अर्पण उन तक पहुँचता है।',
  'pitru.invite':
    'ये पूर्वजों के दिन हैं। जिस तिथि पर कोई अपना हमसे विदा हुआ, उसी तिथि पर श्राद्ध करें — और वह तिथि हर साल याद रखने का काम हम पर छोड़ दें।',
  'pitru.whyTitle': 'श्राद्ध क्यों?',
  'pitru.why':
    'श्राद्ध वह अर्पण है जो श्रद्धा से किया जाए। यह उसी तिथि पर होता है जिस तिथि पर व्यक्ति ने देह त्यागी, इसलिए इसकी तारीख़ हर साल चंद्रमा के साथ बदलती है। तर्पण, पिंडदान और उनके नाम से भोजन कराना इसका सार है।',
  'pitru.sarva':
    'अगर तिथि मालूम न हो, तो पखवाड़े का अंतिम दिन — सर्व पितृ अमावस्या — सभी पूर्वजों के लिए होता है।',
  'pitru.bookShraddh': 'पितृ पक्ष श्राद्ध बुक करें',
  'pitru.remember': 'किसी अपने को याद रखें',

  'upcoming.title': 'आने वाले पावन दिन',
  'upcoming.intro':
    '{place} के पंचांग के अनुसार अगले तीन महीनों के व्रत और पर्व, साथ में वे पूजाएँ जो परिवार परंपरा से इन दिनों करवाते हैं।',
  'upcoming.empty': 'अगले तीन महीनों में कोई पावन दिन नहीं मिला।',
  'upcoming.unavailable': 'पावन दिनों की सूची अभी नहीं खुल सकी। थोड़ी देर बाद पेज फिर से खोलें।',

  'cta.title': 'याद रखने का काम हम पर छोड़ दें',
  'cta.text':
    'वे दिन चुनें जो आप मानते हैं — एकादशी, पूर्णिमा, प्रदोष — और हम आपको उसी दिन या एक हफ़्ता पहले ईमेल, SMS या यहीं याद दिला देंगे।',
  'cta.action': 'मेरे दिन चुनें',

  'place.showing': '{place} का पंचांग दिखाया जा रहा है',
  'place.approx': 'यह आपके टाइम ज़ोन से अनुमान है — सही सूर्योदय के लिए अपना शहर चुनें।',
  'place.yourLocation': 'आपका स्थान',
  'place.useExact': 'मेरा सटीक स्थान लें',
  'place.finding': 'आपका स्थान खोजा जा रहा है…',
  'place.updating': '{place} का पंचांग लाया जा रहा है…',
  'place.change': 'शहर बदलें',
  'place.fallback': '{place} का पंचांग अभी नहीं बन सका, इसलिए भारत (IST) का पंचांग दिखाया गया है।',
  'place.dialogTitle': 'किस शहर का पंचांग देखें?',
  'place.dialogDesc':
    'तिथि, सूर्योदय और पर्वों की तारीख़ें शहर के अनुसार बदलती हैं। जहाँ आप रहते हैं, वह शहर चुनें — चाहे घर से कितनी भी दूर हो।',
  'place.filter': 'शहर खोजें',
  'place.noMatch': 'इस नाम का कोई शहर नहीं मिला। उसी टाइम ज़ोन का कोई पास का बड़ा शहर चुनें।',
  'place.india': 'भारत में',
  'place.abroad': 'विदेश में',
  'place.error.unsupported': 'आपका ब्राउज़र स्थान नहीं बता सकता। कृपया अपना शहर चुनें।',
  'place.error.denied':
    'इस साइट के लिए स्थान की अनुमति बंद है। ब्राउज़र की सेटिंग में अनुमति दें, या अपना शहर चुनें।',
  'place.error.timeout': 'स्थान खोजने में बहुत देर लगी। फिर से कोशिश करें, या अपना शहर चुनें।',
  'place.error.unavailable': 'अभी आपका स्थान नहीं मिल सका। कृपया अपना शहर चुनें।',
};

export default panchang;
