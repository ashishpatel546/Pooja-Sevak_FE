// Aggregates namespace dictionaries. Add a namespace by creating en/<ns>.ts + hi/<ns>.ts and listing it here.
import en_common from './en/common';
import en_nav from './en/nav';
import en_auth from './en/auth';
import en_home from './en/home';
import en_catalog from './en/catalog';
import en_booking from './en/booking';
import en_customer from './en/customer';
import en_reminders from './en/reminders';
import en_panchang from './en/panchang';
import en_account from './en/account';
import en_dashboard from './en/dashboard';
import en_pandit from './en/pandit';
import en_admin from './en/admin';
import en_notifications from './en/notifications';
import en_errors from './en/errors';
import en_seo from './en/seo';
import en_info from './en/info';
import en_legal from './en/legal';
import en_business from './en/business';
import en_samagri from './en/samagri';
import en_payouts from './en/payouts';
import en_chat from './en/chat';
import hi_common from './hi/common';
import hi_nav from './hi/nav';
import hi_auth from './hi/auth';
import hi_home from './hi/home';
import hi_catalog from './hi/catalog';
import hi_booking from './hi/booking';
import hi_customer from './hi/customer';
import hi_reminders from './hi/reminders';
import hi_panchang from './hi/panchang';
import hi_account from './hi/account';
import hi_dashboard from './hi/dashboard';
import hi_pandit from './hi/pandit';
import hi_admin from './hi/admin';
import hi_notifications from './hi/notifications';
import hi_errors from './hi/errors';
import hi_seo from './hi/seo';
import hi_info from './hi/info';
import hi_legal from './hi/legal';
import hi_business from './hi/business';
import hi_samagri from './hi/samagri';
import hi_payouts from './hi/payouts';
import hi_chat from './hi/chat';

export const en = {
  common: en_common,
  nav: en_nav,
  auth: en_auth,
  home: en_home,
  catalog: en_catalog,
  booking: en_booking,
  customer: en_customer,
  reminders: en_reminders,
  panchang: en_panchang,
  account: en_account,
  dashboard: en_dashboard,
  pandit: en_pandit,
  admin: en_admin,
  notifications: en_notifications,
  errors: en_errors,
  seo: en_seo,
  info: en_info,
  legal: en_legal,
  business: en_business,
  samagri: en_samagri,
  payouts: en_payouts,
  chat: en_chat,
};

export type Messages = typeof en;
export type Namespace = keyof Messages;

export const hi: { [N in Namespace]: Record<keyof Messages[N], string> } = {
  common: hi_common,
  nav: hi_nav,
  auth: hi_auth,
  home: hi_home,
  catalog: hi_catalog,
  booking: hi_booking,
  customer: hi_customer,
  reminders: hi_reminders,
  panchang: hi_panchang,
  account: hi_account,
  dashboard: hi_dashboard,
  pandit: hi_pandit,
  admin: hi_admin,
  notifications: hi_notifications,
  errors: hi_errors,
  seo: hi_seo,
  info: hi_info,
  legal: hi_legal,
  business: hi_business,
  samagri: hi_samagri,
  payouts: hi_payouts,
  chat: hi_chat,
};
