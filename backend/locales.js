// locales.js — daftar bahasa + negara + mata uang yang bisa dipilih di chatbot.
// Harus sejalan dengan frontend/lib/locales.ts.
export const DEFAULT_LOCALE = 'id-ID';

export const LOCALES = {
  'id-ID': { language: 'Indonesian (Bahasa Indonesia)', country: 'Indonesia', currency: 'IDR' },
  'su-ID': { language: 'Sundanese (Basa Sunda)', country: 'Indonesia', currency: 'IDR' },
  'jv-ID': { language: 'Javanese (Basa Jawa)', country: 'Indonesia', currency: 'IDR' },
  'en-US': { language: 'English', country: 'United States', currency: 'USD' },
  'en-GB': { language: 'English', country: 'United Kingdom', currency: 'GBP' },
  'en-SG': { language: 'English', country: 'Singapore', currency: 'SGD' },
  'en-AU': { language: 'English', country: 'Australia', currency: 'AUD' },
  'ms-MY': { language: 'Malay (Bahasa Melayu)', country: 'Malaysia', currency: 'MYR' },
  'ar-SA': { language: 'Arabic', country: 'Saudi Arabia', currency: 'SAR' },
  'zh-CN': { language: 'Chinese (Simplified)', country: 'China', currency: 'CNY' },
  'ja-JP': { language: 'Japanese', country: 'Japan', currency: 'JPY' },
  'ko-KR': { language: 'Korean', country: 'South Korea', currency: 'KRW' },
  'hi-IN': { language: 'Hindi', country: 'India', currency: 'INR' },
  'th-TH': { language: 'Thai', country: 'Thailand', currency: 'THB' },
  'vi-VN': { language: 'Vietnamese', country: 'Vietnam', currency: 'VND' },
  'fr-FR': { language: 'French', country: 'France', currency: 'EUR' },
  'de-DE': { language: 'German', country: 'Germany', currency: 'EUR' },
  'es-ES': { language: 'Spanish', country: 'Spain', currency: 'EUR' },
  'nl-NL': { language: 'Dutch', country: 'Netherlands', currency: 'EUR' },
  'pt-BR': { language: 'Portuguese', country: 'Brazil', currency: 'BRL' },
  'ru-RU': { language: 'Russian', country: 'Russia', currency: 'RUB' },
  'tr-TR': { language: 'Turkish', country: 'Turkey', currency: 'TRY' },
};

export function getLocale(code) {
  const key = Object.hasOwn(LOCALES, code) ? code : DEFAULT_LOCALE;
  return { code: key, tag: key, ...LOCALES[key] };
}
