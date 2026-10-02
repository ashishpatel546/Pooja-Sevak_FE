import type en from '../en/notifications';

// हिन्दी — must define every key in ../en/notifications.ts (tsc enforces it).
const notifications: Record<keyof typeof en, string> = {
  'bell.label': 'सूचनाएँ',
  'bell.labelUnread_one': 'सूचनाएँ, {count} अपठित',
  'bell.labelUnread_other': 'सूचनाएँ, {count} अपठित',
  'live.unread_one': 'आपकी {count} सूचना अभी पढ़ी नहीं गई है।',
  'live.unread_other': 'आपकी {count} सूचनाएँ अभी पढ़ी नहीं गई हैं।',
  'live.none': 'कोई नई सूचना नहीं है।',
  'panel.title': 'सूचनाएँ',
  'panel.markAll': 'सभी को पढ़ा हुआ मानें',
  'panel.markAllFailed': 'सूचनाओं को पढ़ा हुआ नहीं किया जा सका। कृपया फिर से प्रयास करें।',
  'panel.loading': 'सूचनाएँ लोड हो रही हैं…',
  'panel.error': 'अभी आपकी सूचनाएँ लोड नहीं हो सकीं।',
  'panel.retry': 'फिर से प्रयास करें',
  'empty.title': 'अभी सब शांत है',
  'empty.body': 'जब कोई बुकिंग पुष्ट होगी या कोई पावन दिन निकट आएगा, तो एक छोटा-सा संदेश यहाँ आपकी प्रतीक्षा करेगा।',
  'item.unread': 'अपठित',
  'time.justNow': 'अभी-अभी',
};

export default notifications;
