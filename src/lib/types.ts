// Shared API shapes. Field names match the backend (see docs/API.md).

export type Role = 'admin' | 'pandit' | 'customer';
export type Coordinates = { lat: number; lng: number };

export type PreferredLanguage = 'hi' | 'en';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  mobile: string | null;
  mobile_verified: boolean;
  email_verified: boolean;
  preferred_language: PreferredLanguage;
  /** Same-origin profile photo URLs (/v1/media/avatars/...), null when none. */
  photo_url?: string | null;
  photo_thumb_url?: string | null;
};

/** Anything that may carry profile photo URLs (users, pandit summaries). */
export type PhotoUrls = { photo_url?: string | null; photo_thumb_url?: string | null };

/** Every sign-in / refresh response. The refresh token travels only in the httpOnly `ps_rt` cookie. */
export type AuthResponse = { access_token: string; user: AuthUser; token_type?: 'Bearer'; expires_in?: number };

/** GET /auth/sessions item: one signed-in device (refresh-token family). */
export type AuthSession = {
  id: string;
  device: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  current: boolean;
};

export type ServiceCategory =
  | 'Sanskar'
  | 'Griha & Vastu'
  | 'Shanti & Dosh'
  | 'Path & Katha'
  | 'Festival'
  | 'Abhishek & Jaap';

export type ServiceDefinition = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  significance: string | null;
  /** Hindi copy; use pick(def, 'name', locale) to choose. */
  name_hi: string | null;
  tagline_hi: string | null;
  description_hi: string | null;
  significance_hi: string | null;
  category: ServiceCategory | string | null;
  deity: string | null;
  samagri: string[];
  typical_duration_minutes: number | null;
  supports_online: boolean;
  is_active: boolean;
  starting_price: number | null;
  pandit_count: number;
};

export type ServiceDefinitionInput = Partial<
  Omit<ServiceDefinition, 'id' | 'starting_price' | 'pandit_count'>
> & { name: string };

export type SamagriListType = 'pdf' | 'image';

/** A pandit's uploaded samagri list for one puja (same-origin URLs). */
export type SamagriList = {
  /** 302 to the stored file (open in a new tab, <img src>). */
  url: string;
  /** The bytes from this origin, for the in-app PDF viewer. */
  data_url: string;
  type: SamagriListType;
  /** Page count (PDFs only). */
  pages: number | null;
  updated_at: string | null;
};

/** Who arranges the puja samagri for a booking. */
export type SamagriBy = 'family' | 'pandit';

/** Samagri fields of a pandit service (list + the optional "pandit brings it" kit). */
export type PanditServiceSamagri = {
  /** null for older pujas added before lists were required. */
  samagri_list?: SamagriList | null;
  /** The pandit brings all the samagri (at-home bookings only). */
  offers_samagri_kit?: boolean;
  /** Kit price in rupees (kept when the offer is switched off). */
  samagri_kit_price?: number | null;
  /**
   * The shorter (lighter) version's own list. Required when the lighter mode
   * is offered; null for older services (then the full list applies).
   */
  lighter_samagri_list?: SamagriList | null;
  /** Kit price for the shorter version (null for older services: the full kit price applies). */
  lighter_samagri_kit_price?: number | null;
};

export type PanditServiceItem = PanditServiceSamagri & {
  id: string;
  pandit_id: string;
  service_definition_id: string;
  service_definition?: ServiceDefinition;
  standard_price: number;
  standard_duration_minutes: number;
  offers_lighter_mode: boolean;
  lighter_mode_price: number | null;
  lighter_mode_duration_minutes: number | null;
  is_active: boolean;
};

export type PanditProfile = {
  id: string;
  user_id: string;
  bio: string | null;
  home_coordinates: Coordinates;
  max_travel_distance_km: number;
  travel_buffer_minutes: number;
  experience_years: number;
  languages: string[];
  tradition: string | null;
  city: string | null;
  offers_online: boolean;
  work_start_hour: number;
  work_end_hour: number;
  /** Public visibility: true only when verification_status is 'approved'. */
  is_verified: boolean;
  verification_status: PanditVerificationStatus;
  /** Admin's reason for the last rejection (shown to the pandit). */
  verification_note: string | null;
  reviewed_at: string | null;
  kyc_submitted_at: string | null;
  aadhaar_number: string | null;
  /** Set only when a real KYC provider confirms the Aadhaar. */
  aadhaar_verified_at: string | null;
  average_rating: number;
  total_reviews: number;
};

export type PanditVerificationStatus = 'not_submitted' | 'pending_review' | 'approved' | 'rejected';

/** Service as embedded in browse results. */
export type PanditListService = PanditServiceSamagri & {
  id: string;
  service_definition_id: string;
  service_name: string;
  service_name_hi: string | null;
  service_slug: string;
  category: string | null;
  supports_online: boolean;
  standard_price: number;
  standard_duration_minutes: number;
  offers_lighter_mode: boolean;
  lighter_mode_price: number | null;
  lighter_mode_duration_minutes: number | null;
};

/** Averages per rating parameter (null until a detailed review rates it). */
export type RatingBreakdown = {
  vidhi: number | null;
  nature: number | null;
  punctuality: number | null;
  overall: number;
  /** Reviews that include the per-parameter ratings. */
  detailed_reviews: number;
};

export type PanditListItem = {
  id: string;
  user_id: string;
  name: string;
  photo_url?: string | null;
  photo_thumb_url?: string | null;
  bio: string | null;
  average_rating: number;
  total_reviews: number;
  rating_breakdown?: RatingBreakdown;
  experience_years: number;
  languages: string[];
  tradition: string | null;
  city: string | null;
  offers_online: boolean;
  is_verified: boolean;
  max_travel_distance_km: number;
  distance_km: number | null;
  services: PanditListService[];
};

export type Review = {
  id: string;
  /** Present on the customer's own review; omitted from public listings. */
  booking_id?: string;
  pandit_id: string;
  customer_id?: string;
  /** Overall stars (= rating_overall). */
  rating: number;
  /** Per-parameter stars (1–5); null on reviews written before they existed. */
  rating_vidhi?: number | null;
  rating_nature?: number | null;
  rating_punctuality?: number | null;
  rating_overall?: number | null;
  /** Remarks. */
  comment: string | null;
  created_at: string;
  updated_at?: string;
  /** Public listings: first name + last initial, e.g. "Asha D.". */
  customer_name?: string;
  /** Reviewer's 128px photo (null when none). */
  customer_photo_url?: string | null;
  /** The reviewer has since deleted their account. */
  customer_deleted?: boolean;
};

export type PanditPublic = Omit<PanditListItem, 'distance_km' | 'services'> & {
  work_start_hour: number;
  work_end_hour: number;
  services: (PanditServiceItem & { service_definition: ServiceDefinition })[];
  reviews: Review[];
};

export type Slot = { start: string; available: boolean };
export type Availability = {
  date: string;
  duration_minutes: number;
  slots: Slot[];
};

export type Address = {
  id: string;
  label: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  pin_code: string;
  location_coordinates: Coordinates;
  is_default: boolean;
};
export type AddressInput = Omit<Address, 'id' | 'address_line_2' | 'is_default'> & {
  address_line_2?: string;
  is_default?: boolean;
};

export type PujaMode = 'standard' | 'lighter';
export type BookingType = 'at_home' | 'online';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
/** Settlement of the pandit's credit; `due` only once the puja is completed. */
export type PayoutStatus = 'not_due' | 'due' | 'on_hold' | 'settled';
export type CompletedVia = 'code' | 'admin';

export type Sankalp = {
  devotee_name: string;
  gotra?: string;
  nakshatra?: string;
  occasion?: string;
  family_members?: string[];
};

export type CreateBookingInput = {
  pandit_service_id: string;
  booking_type: BookingType;
  address_id?: string;
  puja_mode: PujaMode;
  start_time: string;
  customer_notes?: string;
  sankalp?: Sankalp;
  /** 'pandit' books the pandit's samagri kit (at-home only). */
  samagri_by?: SamagriBy;
};

export type Booking = {
  id: string;
  customer_id: string;
  pandit_id: string;
  pandit_service_id: string;
  address_id: string | null;
  booking_type: BookingType;
  puja_mode: PujaMode;
  start_time: string;
  end_time: string;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  payment_transaction_id: string | null;
  /** Set when a paid booking is cancelled and the provider refund is issued. */
  refund_id: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  /** Puja price; commission and pandit credit come out of this. */
  total_amount: number;
  platform_commission: number;
  pandit_credit: number;
  /** Who arranges the samagri ('family' for older bookings). */
  samagri_by?: SamagriBy;
  /** The pandit's samagri kit price at booking time; 0 unless samagri_by is 'pandit'. */
  samagri_amount?: number | null;
  /** Platform fee paid by the customer on top of the puja price (0 for older bookings). */
  customer_fee_amount?: number | null;
  customer_fee_rule?: CustomerFeeRule | null;
  cancellation_reason: string | null;
  customer_notes: string | null;
  sankalp: Sankalp | null;
  meeting_url: string | null;
  /**
   * The family's 6-digit completion code. Only present in the customer's own
   * (and admin) responses for confirmed / in-progress bookings — never for pandits.
   */
  completion_code?: string | null;
  completion_code_attempts?: number;
  completion_code_locked_at?: string | null;
  completed_at?: string | null;
  completed_via?: CompletedVia | null;
  completion_note?: string | null;
  payout_status?: PayoutStatus;
  payout_settled_at?: string | null;
  payout_reference?: string | null;
  payout_note?: string | null;
  created_at: string;
  updated_at: string;
  customer?: AuthUser;
  pandit?: PanditProfile & { user?: AuthUser };
  pandit_service?: PanditServiceItem & { service_definition?: ServiceDefinition };
  address?: Address | null;
  review?: Review | null;
};

export type PaymentOrder = {
  provider: 'razorpay' | 'mock';
  order_id: string;
  amount: number; // paise
  currency: 'INR';
  key_id?: string;
  booking_id: string;
};

export type PanditEarnings = {
  total_bookings: number;
  completed: number;
  upcoming: number;
  /** Dakshina of completed pujas. */
  gross: number;
  /** Samagri kits of completed pujas (paid to the pandit in full). */
  samagri?: number;
  commission: number;
  /** Dakshina − commission + samagri. */
  net_earned: number;
  this_month_net: number;
  /** Completed, awaiting settlement. */
  payout_due: number;
  payout_on_hold: number;
  /** Already paid out to the pandit. */
  payout_settled: number;
  payout_due_count: number;
  payout_on_hold_count: number;
};

export type SettlementBooking = {
  id: string;
  start_time: string;
  completed_at: string | null;
  completed_via: CompletedVia | null;
  puja: { name: string; name_hi: string | null } | null;
  customer_name: string | null;
  total_amount: number;
  platform_commission: number;
  pandit_credit: number;
  /** Samagri kit (0 when the family arranged it). */
  samagri_amount: number;
  /** What is paid out: pandit_credit + samagri_amount. */
  payout_amount: number;
  payout_status: PayoutStatus;
  payout_settled_at: string | null;
  payout_reference: string | null;
  payout_note: string | null;
  /** Set while the booking is part of the pandit's withdrawal request. */
  withdrawal_id: string | null;
};

export type SettlementGroup = {
  pandit_id: string;
  name: string | null;
  mobile: string | null;
  email: string | null;
  city: string | null;
  due_total: number;
  due_count: number;
  on_hold_total: number;
  on_hold_count: number;
  bookings: SettlementBooking[];
};

export type SettlementOverview = {
  totals: { due: number; due_count: number; on_hold: number; on_hold_count: number };
  pandits: SettlementGroup[];
  recent_settled: (SettlementBooking & { pandit_id: string; pandit_name: string | null })[];
};

// ── Pandit payouts: bank account + withdrawals ──

export type PayoutAccountStatus =
  | 'verifying'
  | 'needs_document'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'replaced';

/** Why the pandit has to act on his account. */
export type PayoutAccountReason = 'bank_name_mismatch' | 'bank_invalid' | 'bank_unavailable' | 'admin';

/** The pandit's own view: account number and PAN masked. */
export type PayoutAccount = {
  id: string;
  status: PayoutAccountStatus;
  reason: PayoutAccountReason | null;
  account_holder_name: string;
  account_number_masked: string;
  ifsc: string;
  bank_name: string | null;
  branch: string | null;
  pan_masked: string;
  verified_via: 'bank' | 'document' | null;
  review_note: string | null;
  has_document: boolean;
  document_uploaded_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type PayoutAccountState = {
  /** Payouts go only to an account in this name. */
  kyc_name: string | null;
  blocked_reason: 'profile_not_approved' | 'no_kyc_name' | null;
  bank_check_enabled: boolean;
  account: PayoutAccount | null;
};

export type WithdrawalStatus = 'requested' | 'paid' | 'rejected' | 'cancelled';

export type Withdrawal = {
  id: string;
  amount: number;
  booking_count: number;
  status: WithdrawalStatus;
  reference: string | null;
  note: string | null;
  requested_at: string;
  processed_at: string | null;
  account_number_masked: string | null;
  bank_name: string | null;
};

export type WithdrawalSummary = {
  available: number;
  available_count: number;
  min_withdrawal: number;
  account_approved: boolean;
  can_withdraw: boolean;
  open_request: Withdrawal | null;
  history: Withdrawal[];
};

/** An operator's view of an account under review: full details. */
export type AdminPayoutAccount = Omit<PayoutAccount, 'account_number_masked' | 'pan_masked'> & {
  pandit_id: string;
  pandit_name: string | null;
  pandit_mobile: string | null;
  pandit_city: string | null;
  kyc_name: string | null;
  account_number: string;
  pan_number: string;
  bank_registered_name: string | null;
};

export type AdminWithdrawal = {
  id: string;
  status: WithdrawalStatus;
  amount: number;
  booking_count: number;
  reference: string | null;
  note: string | null;
  requested_at: string;
  processed_at: string | null;
  pandit_id: string;
  pandit_name: string | null;
  pandit_mobile: string | null;
  pandit_city: string | null;
  account: (PayoutAccount & { account_number: string; pan_number: string }) | null;
  bookings: {
    id: string;
    start_time: string;
    completed_at: string | null;
    puja: { name: string; name_hi: string | null } | null;
    customer_name: string | null;
    payout_amount: number;
  }[];
};

// ── Booking chat and the call button ──

export type ChatRole = 'customer' | 'pandit';
export type ChatBlockReason = 'phone' | 'email' | 'upi' | 'link' | 'social' | 'contact_request';

export type ChatMessage = {
  id: string;
  sender_role: ChatRole;
  body: string;
  created_at: string;
};

export type ChatThread = {
  me: ChatRole;
  can_send: boolean;
  closed_reason: 'unpaid' | 'completed' | 'cancelled' | null;
  strikes: number;
  messages: ChatMessage[];
};

/** Body of the 422 when a message carried contact details. */
export type ChatBlocked = {
  code: 'CONTACT_INFO_BLOCKED';
  message: string;
  reasons: ChatBlockReason[];
  strikes: number;
};

/** The other side's phone, only inside the call window. */
export type BookingContact = {
  with: ChatRole;
  name: string | null;
  opens_at: string;
  closes_at: string;
  open: boolean;
  reason: 'not_yet' | 'not_confirmed' | 'finished' | 'no_number' | null;
  phone: string | null;
};

export type ChatFlagStatus = 'open' | 'dismissed' | 'warned';

export type AdminChatFlag = {
  id: string;
  status: ChatFlagStatus;
  body: string;
  reasons: ChatBlockReason[];
  created_at: string;
  review_note: string | null;
  reviewed_at: string | null;
  sender_id: string;
  sender_role: ChatRole;
  sender_name: string | null;
  sender_strikes: number;
  pandit_profile_id: string | null;
  booking: {
    id: string;
    start_time: string;
    booking_status: BookingStatus;
    customer_name: string | null;
    pandit_name: string | null;
    puja: { name: string; name_hi: string | null } | null;
  } | null;
};

export type AdminChatThread = {
  booking_id: string;
  customer_name: string | null;
  pandit_name: string | null;
  messages: (ChatMessage & { blocked: boolean; reasons: ChatBlockReason[] })[];
};

export type AdminStats = {
  users: number;
  customers: number;
  pandits: number;
  verified_pandits: number;
  pending_pandits: number;
  bookings: number;
  bookings_by_status: Record<BookingStatus, number>;
  /** What customers paid: dakshina + samagri kits + customer fees. */
  gmv: number;
  dakshina?: number;
  /** Samagri kits (passed to pandits in full; not platform revenue). */
  samagri?: number;
  commission: number;
  customer_fees: number;
  /** commission + customer_fees */
  platform_revenue: number;
};

export type AdminPandit = PanditProfile & {
  user: AuthUser & { created_at: string };
  services_count: number;
  /** Active pujas offered. */
  services: { id: string; name: string; name_hi: string | null }[];
};

export type GlobalSetting = { key: string; value: string; description: string | null };

export type CustomerFeeMode = 'percent' | 'flat';

/** Mirrors backend CustomerFeeRule (snapshotted on each booking). */
export type CustomerFeeRule = {
  mode: CustomerFeeMode;
  /** Percent of the puja price, or flat rupees. */
  value: number;
  /** Rupee floor / ceiling (percent mode only); null = no cap. */
  min_amount: number | null;
  max_amount: number | null;
};

/** GET /public/customer-fee, GET/PUT /admin/customer-fee */
export type CustomerFeeConfig = CustomerFeeRule & { enabled: boolean };

// ───────────────────────── Phase 2 (see docs/API.md → "Phase 2") ─────────────────────────

/** POST /auth/mobile/send-otp */
export type SendOtpResponse = {
  message: string;
  mobile: string;
  expires_in: number; // seconds
  resend_after: number; // seconds
  /** Only outside production while SMS goes to the console provider. */
  dev_otp?: string;
};

export type MessageResponse = { message: string };

/** POST /auth/email/verify-code body; responds with AuthResponse. */
export type VerifyEmailCodeInput = { code: string };

export type VerificationField = 'email' | 'mobile';

/**
 * 403 from POST /bookings and POST /payments/bookings/:id/order when the
 * customer's email or mobile is not verified yet.
 */
export type VerificationRequiredError = {
  statusCode: 403;
  code: 'VERIFICATION_REQUIRED';
  message: string;
  missing: VerificationField[];
};

// Kul (family) profile — reused to prefill every sankalp.
export type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  nakshatra?: string;
  rashi?: string;
  date_of_birth?: string; // YYYY-MM-DD
};

export type FamilyProfile = {
  gotra?: string;
  kuldevta?: string;
  native_place?: string;
  members: FamilyMember[];
};

// Panchang (Hindu lunar calendar), computed for Lucknow unless lat/lng is passed.
export type Paksha = 'shukla' | 'krishna';

export type ObservanceKey =
  | 'festival'
  | 'purnima'
  | 'amavasya'
  | 'ekadashi'
  | 'pradosh'
  | 'sankashti'
  | 'masik_shivratri'
  | 'sankranti'
  | 'pitru_paksha'
  | 'sarva_pitru_amavasya';

/** Festivals the panchang computes (backend: panchang/engine/festivals.ts). */
export type FestivalId =
  | 'makar_sankranti'
  | 'vasant_panchami'
  | 'maha_shivratri'
  | 'holika_dahan'
  | 'holi'
  | 'chaitra_navratri'
  | 'gudi_padwa'
  | 'ram_navami'
  | 'hanuman_jayanti'
  | 'akshaya_tritiya'
  | 'vat_savitri'
  | 'guru_purnima'
  | 'nag_panchami'
  | 'raksha_bandhan'
  | 'janmashtami'
  | 'hartalika_teej'
  | 'ganesh_chaturthi'
  | 'anant_chaturdashi'
  | 'sharad_navratri'
  | 'durga_ashtami'
  | 'dussehra'
  | 'karwa_chauth'
  | 'dhanteras'
  | 'diwali'
  | 'govardhan_puja'
  | 'bhai_dooj'
  | 'chhath_puja';

export type Observance = {
  key: ObservanceKey;
  date: string; // YYYY-MM-DD (IST)
  end_date: string | null; // for ranges such as Pitru Paksha
  name_en: string;
  name_hi: string;
  description_en: string;
  description_hi: string;
  tithi: number | null; // 1–30 (16–30 = krishna paksha)
  paksha: Paksha | null;
  lunar_month_en: string | null; // amanta month, e.g. 'Bhadrapada'
  lunar_month_hi: string | null;
  suggested_puja_slugs: string[];
  /**
   * Set on festivals: every key 'festival' observance, and recurring ones that
   * are also festivals (Makar Sankranti, Maha Shivratri).
   */
  festival?: FestivalId | null;
};

/** Where a panchang is computed: civil dates, sunrise and tithi are local to this place. */
export type PanchangPlace = {
  lat: number;
  lng: number;
  tz: string; // IANA zone, e.g. 'Asia/Kolkata', 'America/Toronto'
  label?: string | null; // e.g. 'Toronto' / 'लखनऊ'
};

export type PanchangDay = {
  location: PanchangPlace;
  date: string;
  sunrise: string; // ISO
  sunset: string; // ISO
  tithi: number;
  tithi_name_en: string; // e.g. 'Shukla Ekadashi'
  tithi_name_hi: string;
  paksha: Paksha;
  lunar_month_en: string;
  lunar_month_hi: string;
  nakshatra_en: string;
  nakshatra_hi: string;
  observances: Observance[];
};

// Reminders
export type RemembranceKind = 'punyatithi' | 'birthday' | 'anniversary' | 'custom';
export type ObserveBy = 'tithi' | 'date';

export type RemembranceInput = {
  person_name: string;
  relation?: string;
  kind: RemembranceKind;
  event_date: string; // YYYY-MM-DD, the original date (e.g. date of passing)
  observe_by: ObserveBy;
  remind_days_before: number; // 0–30
  notes?: string;
};

export type Remembrance = RemembranceInput & {
  id: string;
  relation: string | null;
  notes: string | null;
  /** Lunar date of event_date — present for all, used when observe_by = 'tithi'. */
  tithi: number;
  paksha: Paksha;
  lunar_month_en: string;
  lunar_month_hi: string;
  tithi_label_en: string; // 'Bhadrapada Krishna Dashami'
  tithi_label_hi: string;
  next_date: string; // YYYY-MM-DD of the next observance
  suggested_puja_slugs: string[];
  created_at: string;
};

export type ReminderChannels = { email: boolean; sms: boolean; in_app: boolean };

export type ReminderPreferences = {
  /** null until the user (or the app, automatically) saves a place; server then uses Lucknow/IST. */
  location: PanchangPlace | null;
  observances: ObservanceKey[];
  remind_days_before: number; // for observances; 0 = on the day
  channels: ReminderChannels;
};

export type UpcomingReminder = {
  date: string; // YYYY-MM-DD
  end_date: string | null;
  kind: 'observance' | 'remembrance';
  observance_key: ObservanceKey | null;
  festival?: FestivalId | null;
  remembrance_id: string | null;
  title_en: string;
  title_hi: string;
  subtitle_en: string | null;
  subtitle_hi: string | null;
  suggested_puja_slugs: string[];
};

// In-app notifications
export type AppNotification = {
  id: string;
  type: string;
  title: string; // already in the user's preferred language
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationList = { items: AppNotification[]; unread: number };

/** GET /users/me/deletion — what deleting the account would do. */
export type AccountDeletionPreview = {
  confirm_with: 'password' | 'email';
  blocked: { code: 'in_progress' | 'pandit_upcoming' | 'last_admin'; message: string } | null;
  bookings_to_cancel: number;
  paid_bookings_to_refund: number;
};
