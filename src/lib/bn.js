const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** 123 -> "১২৩" (works on any string, leaves non-digits as they are). */
export const toBn = (value) => String(value ?? '').replace(/\d/g, (d) => BN_DIGITS[d]);

export const bnNumber = (n, opts) => toBn(Number(n || 0).toLocaleString('en-IN', opts));

export const bnDate = (date, opts = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', ...opts }).format(new Date(date));

/** Whole days left until `date` (never negative). */
export const daysLeft = (date) => Math.max(0, Math.ceil((new Date(date) - Date.now()) / 86_400_000));

export const ORDINAL_CHAPTER = ['প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম', 'ষষ্ঠ'];
