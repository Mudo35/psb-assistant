// Daftar bahasa + negara + mata uang yang bisa dipilih di chatbot.
// Harus sejalan dengan backend/locales.js.
export type AppLocale = { code: string; lang: string; label: string; currency: string; rtl?: boolean }

export const SOURCE_LOCALE = 'id-ID' // bahasa asli isi website

export const LOCALES: AppLocale[] = [
  { code: 'id-ID', lang: 'id', label: 'Bahasa Indonesia (Indonesia)', currency: 'IDR' },
  { code: 'su-ID', lang: 'su', label: 'Basa Sunda (Indonesia)', currency: 'IDR' },
  { code: 'jv-ID', lang: 'jv', label: 'Basa Jawa (Indonesia)', currency: 'IDR' },
  { code: 'en-US', lang: 'en', label: 'English (United States)', currency: 'USD' },
  { code: 'en-GB', lang: 'en', label: 'English (United Kingdom)', currency: 'GBP' },
  { code: 'en-SG', lang: 'en', label: 'English (Singapore)', currency: 'SGD' },
  { code: 'en-AU', lang: 'en', label: 'English (Australia)', currency: 'AUD' },
  { code: 'ms-MY', lang: 'ms', label: 'Bahasa Melayu (Malaysia)', currency: 'MYR' },
  { code: 'ar-SA', lang: 'ar', label: 'العربية (السعودية)', currency: 'SAR', rtl: true },
  { code: 'zh-CN', lang: 'zh', label: '中文 (中国)', currency: 'CNY' },
  { code: 'ja-JP', lang: 'ja', label: '日本語 (日本)', currency: 'JPY' },
  { code: 'ko-KR', lang: 'ko', label: '한국어 (대한민국)', currency: 'KRW' },
  { code: 'hi-IN', lang: 'hi', label: 'हिन्दी (भारत)', currency: 'INR' },
  { code: 'th-TH', lang: 'th', label: 'ไทย (ประเทศไทย)', currency: 'THB' },
  { code: 'vi-VN', lang: 'vi', label: 'Tiếng Việt (Việt Nam)', currency: 'VND' },
  { code: 'fr-FR', lang: 'fr', label: 'Français (France)', currency: 'EUR' },
  { code: 'de-DE', lang: 'de', label: 'Deutsch (Deutschland)', currency: 'EUR' },
  { code: 'es-ES', lang: 'es', label: 'Español (España)', currency: 'EUR' },
  { code: 'nl-NL', lang: 'nl', label: 'Nederlands (Nederland)', currency: 'EUR' },
  { code: 'pt-BR', lang: 'pt', label: 'Português (Brasil)', currency: 'BRL' },
  { code: 'ru-RU', lang: 'ru', label: 'Русский (Россия)', currency: 'RUB' },
  { code: 'tr-TR', lang: 'tr', label: 'Türkçe (Türkiye)', currency: 'TRY' },
]

export function findLocale(code: string | null | undefined): AppLocale {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0]
}
