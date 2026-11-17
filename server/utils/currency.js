// Paying in the member's own currency (record submission and challenge fees).
// Fees are set in US dollars (Admin → Fees); at checkout they are converted at today's exchange rate.
// Rates come from open.er-api.com (free, no key), cached for 6 hours and saved in system_settings as a
// fallback. Stripe charges the converted amount in that currency; Stripe settles it to the account in USD.
const supabase = require('../config/supabase');

// Currencies without cents (Stripe "zero-decimal")
const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);
// Stripe needs whole units for these even though they have cents
const WHOLE_UNITS = new Set(['HUF', 'TWD', 'ISK']);

// Country (as written in the site's country lists) → currency. Countries not listed pay in US dollars.
// Three-decimal currencies (Kuwait, Bahrain, Oman, Jordan, Tunisia) stay in US dollars.
const EURO = ['Austria', 'Belgium', 'Croatia', 'Cyprus', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Portugal', 'Slovakia', 'Slovenia', 'Spain', 'Andorra', 'Monaco', 'San Marino', 'Vatican City', 'Montenegro', 'Kosovo'];
const COUNTRY_CURRENCY = {
  ...Object.fromEntries(EURO.map((c) => [c, 'EUR'])),
  'United States': 'USD', 'United Kingdom': 'GBP', Canada: 'CAD', Australia: 'AUD', 'New Zealand': 'NZD', India: 'INR', Pakistan: 'PKR',
  Bangladesh: 'BDT', 'Sri Lanka': 'LKR', Nepal: 'NPR', Japan: 'JPY', 'Korea, South': 'KRW', China: 'CNY', 'Hong Kong': 'HKD', Singapore: 'SGD',
  Malaysia: 'MYR', Thailand: 'THB', Indonesia: 'IDR', Philippines: 'PHP', Vietnam: 'VND', Taiwan: 'TWD', 'United Arab Emirates': 'AED',
  'Saudi Arabia': 'SAR', Qatar: 'QAR', Israel: 'ILS', Turkey: 'TRY', Egypt: 'EGP', Morocco: 'MAD', Nigeria: 'NGN', Kenya: 'KES', Ghana: 'GHS',
  'South Africa': 'ZAR', Uganda: 'UGX', Tanzania: 'TZS', Ethiopia: 'ETB', Rwanda: 'RWF', Brazil: 'BRL', Mexico: 'MXN', Colombia: 'COP',
  Chile: 'CLP', Peru: 'PEN', Argentina: 'ARS', Uruguay: 'UYU', Paraguay: 'PYG', Bolivia: 'BOB', 'Dominican Republic': 'DOP', Jamaica: 'JMD',
  'Trinidad and Tobago': 'TTD', 'Costa Rica': 'CRC', Guatemala: 'GTQ', Honduras: 'HNL', Nicaragua: 'NIO', Switzerland: 'CHF', Liechtenstein: 'CHF',
  Sweden: 'SEK', Norway: 'NOK', Denmark: 'DKK', Iceland: 'ISK', Poland: 'PLN', 'Czech Republic': 'CZK', Czechia: 'CZK', Hungary: 'HUF', Romania: 'RON',
  Bulgaria: 'BGN', Serbia: 'RSD', Ukraine: 'UAH', Georgia: 'GEL', Armenia: 'AMD', Azerbaijan: 'AZN', Kazakhstan: 'KZT', Uzbekistan: 'UZS',
  Mongolia: 'MNT', Cambodia: 'KHR', Laos: 'LAK', Maldives: 'MVR', Fiji: 'FJD', 'Papua New Guinea': 'PGK', Botswana: 'BWP', Namibia: 'NAD',
  Zambia: 'ZMW', Malawi: 'MWK', Mozambique: 'MZN', Madagascar: 'MGA', Senegal: 'XOF', "Cote d'Ivoire": 'XOF', 'Ivory Coast': 'XOF', Mali: 'XOF',
  Benin: 'XOF', 'Burkina Faso': 'XOF', Niger: 'XOF', Togo: 'XOF', Cameroon: 'XAF', Gabon: 'XAF', Chad: 'XAF', Congo: 'XAF',
  'Central African Republic': 'XAF', 'Equatorial Guinea': 'XAF', Algeria: 'DZD', Lebanon: 'LBP', Bahamas: 'BSD', Barbados: 'BBD', Belize: 'BZD',
  Haiti: 'HTG', Guyana: 'GYD', Suriname: 'SRD', 'Cabo Verde': 'CVE', Gambia: 'GMD', 'Sierra Leone': 'SLE', Liberia: 'LRD', Mauritius: 'MUR',
  Seychelles: 'SCR', Albania: 'ALL', 'North Macedonia': 'MKD', 'Bosnia and Herzegovina': 'BAM', Moldova: 'MDL', Kyrgyzstan: 'KGS', Tajikistan: 'TJS',
  Afghanistan: 'AFN', Samoa: 'WST', Tonga: 'TOP', Vanuatu: 'VUV', Brunei: 'BND',
};
const norm = (s) => String(s || '').trim().toLowerCase();
const currencyForCountry = (country) => {
  const hit = Object.entries(COUNTRY_CURRENCY).find(([c]) => norm(c) === norm(country));
  return hit ? hit[1] : 'USD';
};

// ---------- exchange rates (US dollar = 1) ----------
let cache = { at: 0, rates: null };
const TTL = 6 * 3600e3;
const getRates = async () => {
  if (cache.rates && Date.now() - cache.at < TTL) return cache.rates;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { signal: ctrl.signal });
    clearTimeout(t);
    const j = await r.json();
    if (j?.result !== 'success' || !j.rates?.USD) throw new Error('bad rates');
    cache = { at: Date.now(), rates: j.rates };
    supabase.from('system_settings').upsert({ key: 'fx_rates', value: JSON.stringify({ at: new Date().toISOString(), rates: j.rates }) }, { onConflict: 'key' }).then(() => {}, () => {});
    return j.rates;
  } catch (e) {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'fx_rates').maybeSingle();
    try { const saved = JSON.parse(data?.value || 'null'); if (saved?.rates) { cache = { at: Date.now() - TTL + 600e3, rates: saved.rates }; return saved.rates; } } catch { /* none */ }
    return { USD: 1 };
  }
};

// The currencies a member can choose: every mapped currency that has a rate, US dollar first
const supportedCurrencies = async () => {
  const rates = await getRates();
  const codes = [...new Set(['USD', ...Object.values(COUNTRY_CURRENCY)])].filter((c) => rates[c]);
  return codes.map((code) => ({ code, rate: rates[code] }));
};

const roundFor = (amount, code) => (ZERO_DECIMAL.has(code) || WHOLE_UNITS.has(code) ? Math.round(amount) : Math.round(amount * 100) / 100);
/** US dollars → { amount, currency } at today's rate (rounded the way Stripe needs) */
const fromUsd = async (usd, code) => {
  const c = String(code || 'USD').toUpperCase();
  if (c === 'USD') return { amount: roundFor(usd, 'USD'), currency: 'USD', rate: 1 };
  const rates = await getRates();
  if (!rates[c]) { const e = new Error(`Payments in ${c} are not available right now. Please choose US dollars.`); e.status = 400; throw e; }
  return { amount: roundFor(usd * rates[c], c), currency: c, rate: rates[c] };
};
// Stripe amounts are in the currency's smallest unit
const toMinor = (amount, code) => (ZERO_DECIMAL.has(String(code).toUpperCase()) ? Math.round(amount) : Math.round(amount * 100));
const fromMinor = (minor, code) => (ZERO_DECIMAL.has(String(code || 'USD').toUpperCase()) ? Number(minor) : Math.round(Number(minor)) / 100);

module.exports = { COUNTRY_CURRENCY, currencyForCountry, getRates, supportedCurrencies, fromUsd, toMinor, fromMinor, roundFor, ZERO_DECIMAL };
