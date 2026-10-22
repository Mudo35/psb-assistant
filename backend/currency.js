// currency.js — kurs rupiah ke mata uang negara pengguna + konversi harga di teks.
// Sumber kurs: open.er-api.com (ExchangeRate-API, tanpa API key, update harian, wajib atribusi).
const TTL_MS = 6 * 60 * 60 * 1000; // simpan di memori 6 jam (endpoint gratis dibatasi)
let cache = { at: 0, rates: null, updated: null };

// Kurs CADANGAN (perkiraan kasar, rupiah per 1 unit) jika sumber kurs tidak bisa diakses.
const FALLBACK_IDR_PER_UNIT = {
  USD: 16400, EUR: 19000, GBP: 22000, SGD: 12700, AUD: 10800, MYR: 3900, SAR: 4370,
  CNY: 2300, JPY: 110, KRW: 12, INR: 195, THB: 500, VND: 0.63, BRL: 3000, RUB: 200, TRY: 400,
};

async function loadRates() {
  if (cache.rates && Date.now() - cache.at < TTL_MS) return cache;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/IDR', { signal: ctrl.signal });
    const data = await res.json();
    if (data?.result === 'success' && data.rates) {
      cache = { at: Date.now(), rates: data.rates, updated: data.time_last_update_utc ?? null };
    }
  } catch {
    // diabaikan: pakai cache lama atau kurs cadangan
  } finally {
    clearTimeout(timer);
  }
  return cache;
}

/** @returns {{ perIDR: number, source: 'live' | 'cadangan', updated: string | null }} */
export async function getRate(currency) {
  const { rates, updated } = await loadRates();
  const live = rates?.[currency];
  if (typeof live === 'number' && live > 0) return { perIDR: live, source: 'live', updated };
  const fb = FALLBACK_IDR_PER_UNIT[currency];
  return { perIDR: fb ? 1 / fb : 0, source: 'cadangan', updated: null };
}

/** Ubah setiap "Rp 250.000" pada teks menjadi "≈ US$15.24 (Rp 250.000)". */
export function convertText(text, loc, rate) {
  if (!rate.perIDR) return text;
  let fmt;
  try {
    fmt = new Intl.NumberFormat(`${loc.tag}-u-nu-latn`, { style: 'currency', currency: loc.currency });
  } catch {
    fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: loc.currency });
  }
  return text
    .replace(/\s*\([A-Za-z ]+ rupiah\)/g, '') // buang kata terbilang "(satu juta rupiah)"
    .replace(/Rp\s?(\d{1,3}(?:\.\d{3})*)/g, (_, digits) => {
      const idr = Number(digits.replace(/\./g, ''));
      return `≈ ${fmt.format(idr * rate.perIDR)} (Rp ${digits})`;
    });
}

export function rateNote(loc, rate) {
  if (!rate.perIDR) return `Kurs ${loc.currency} tidak tersedia; tampilkan harga dalam rupiah.`;
  const per = Math.round(1 / rate.perIDR);
  const src = rate.source === 'live'
    ? `sumber exchangerate-api.com${rate.updated ? `, diperbarui ${rate.updated}` : ''}`
    : 'kurs cadangan, perkiraan kasar';
  return `Kurs: 1 ${loc.currency} ≈ Rp ${per.toLocaleString('id-ID')} (${src}).`;
}
