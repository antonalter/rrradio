/* rrradio prices by place. Everything runs in the browser: no lookup service, nothing sent anywhere.
   The country is guessed from the time zone and the browser language; people can change it.
   Charged in euros through Lemon Squeezy; the local figure is a rounded guide.
   Edit TIERS for prices, RATE for exchange rates (euro to local, update now and then). */
(() => {
  const TIERS = {
    A: { start: 3, month: 4, year: 45, life: 69, founding: 49 },  // Switzerland, Norway, US …: highest costs
    B: { start: 3, month: 3, year: 36, life: 59, founding: 39 },  // Western Europe, UK, Canada, Japan …: the base
    C: { start: 2, month: 2, year: 24, life: 39, founding: 29 },  // Southern and Central Europe, Chile, China …
    D: { start: 1, month: 1.5, year: 15, life: 25, founding: 19 },  // Balkans, Turkey, Brazil, Mexico, South Africa …
    E: { start: 1, month: 1, year: 9, life: 15, founding: 12 }   // India, Indonesia, Philippines, Nigeria …
  };
  const ZONES = {
    A: "CH NO IS LU DK US LI MC QA",
    B: "DE AT NL BE FR GB IE SE FI CA AU NZ JP KR SG IL AE HK",
    C: "ES IT PT GR CY MT SI HR CZ SK PL HU EE LV LT TW CL UY SA KW BH OM CN",
    D: "RO BG RS BA ME MK AL MD UA GE AM AZ TR BR MX AR CO PE EC CR PA DO ZA TH MY KZ UZ TN MA JM",
    E: "IN ID PH VN PK BD LK NP EG NG KE GH ET TZ UG BO PY KH MM LA VE",
    X: "RU BY IR KP CU SY"  // card payments can't reach these: a free key on request instead
  };
  const CUR = { CH: "CHF", LI: "CHF", NO: "NOK", IS: "ISK", DK: "DKK", US: "USD", QA: "QAR", GB: "GBP", SE: "SEK", CA: "CAD", AU: "AUD", NZ: "NZD", JP: "JPY", KR: "KRW", SG: "SGD", IL: "ILS", AE: "AED", HK: "HKD",
    CZ: "CZK", PL: "PLN", HU: "HUF", TW: "TWD", CL: "CLP", UY: "UYU", SA: "SAR", KW: "KWD", BH: "BHD", OM: "OMR", CN: "CNY", RO: "RON", BG: "BGN", RS: "RSD", BA: "BAM", MK: "MKD", AL: "ALL", MD: "MDL", UA: "UAH", GE: "GEL", AM: "AMD", AZ: "AZN",
    TR: "TRY", BR: "BRL", MX: "MXN", AR: "USD", CO: "COP", PE: "PEN", EC: "USD", CR: "CRC", PA: "USD", DO: "DOP", ZA: "ZAR", TH: "THB", MY: "MYR", KZ: "KZT", UZ: "UZS", TN: "TND", MA: "MAD", JM: "JMD",
    IN: "INR", ID: "IDR", PH: "PHP", VN: "VND", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", EG: "EGP", NG: "NGN", KE: "KES", GH: "GHS", ET: "ETB", TZ: "TZS", UG: "UGX", BO: "BOB", PY: "PYG", KH: "USD", MM: "USD", LA: "USD", VE: "USD" };
  const RATE = { EUR: 1, USD: 1.1, CHF: .94, NOK: 11.6, ISK: 150, DKK: 7.46, QAR: 4, GBP: .86, SEK: 11.2, CAD: 1.53, AUD: 1.7, NZD: 1.85, JPY: 165, KRW: 1550, SGD: 1.48, ILS: 4, AED: 4, HKD: 8.6,
    CZK: 25, PLN: 4.3, HUF: 395, TWD: 35, CLP: 1050, UYU: 44, SAR: 4.1, KWD: .34, BHD: .41, OMR: .42, CNY: 8, RON: 5, BGN: 1.96, RSD: 117, BAM: 1.96, MKD: 61.5, ALL: 100, MDL: 19.5, UAH: 47, GEL: 3, AMD: 430, AZN: 1.87,
    TRY: 45, BRL: 6.2, MXN: 21, COP: 4600, PEN: 4.1, CRC: 560, DOP: 66, ZAR: 20.5, THB: 37, MYR: 4.9, KZT: 560, UZS: 14000, TND: 3.4, MAD: 10.8, JMD: 172,
    INR: 94, IDR: 18000, PHP: 63, VND: 28500, PKR: 310, BDT: 130, LKR: 330, NPR: 150, EGP: 54, NGN: 1700, KES: 145, GHS: 16, ETB: 140, TZS: 2900, UGX: 4000, BOB: 7.6, PYG: 8600 };
  const WHOLE = new Set("JPY KRW ISK HUF CLP COP CRC INR IDR VND PKR BDT LKR NPR NGN KES ETB TZS UGX PYG KZT UZS AMD RSD MKD ALL UAH TRY DOP JMD TWD CZK PHP THB EGP UYU".split(" "));
  const TZ = { Zurich: "CH", Oslo: "NO", Reykjavik: "IS", Luxembourg: "LU", Copenhagen: "DK", New_York: "US", Chicago: "US", Denver: "US", Los_Angeles: "US", Phoenix: "US", Anchorage: "US", Honolulu: "US", Detroit: "US", Qatar: "QA",
    Berlin: "DE", Vienna: "AT", Amsterdam: "NL", Brussels: "BE", Paris: "FR", London: "GB", Dublin: "IE", Stockholm: "SE", Helsinki: "FI", Toronto: "CA", Vancouver: "CA", Edmonton: "CA", Winnipeg: "CA", Halifax: "CA", Sydney: "AU", Melbourne: "AU", Brisbane: "AU", Perth: "AU", Adelaide: "AU", Auckland: "NZ", Tokyo: "JP", Seoul: "KR", Singapore: "SG", Jerusalem: "IL", Tel_Aviv: "IL", Dubai: "AE", Hong_Kong: "HK",
    Madrid: "ES", Canary: "ES", Rome: "IT", Lisbon: "PT", Athens: "GR", Nicosia: "CY", Malta: "MT", Ljubljana: "SI", Zagreb: "HR", Prague: "CZ", Bratislava: "SK", Warsaw: "PL", Budapest: "HU", Tallinn: "EE", Riga: "LV", Vilnius: "LT", Taipei: "TW", Santiago: "CL", Montevideo: "UY", Riyadh: "SA", Kuwait: "KW", Bahrain: "BH", Muscat: "OM", Shanghai: "CN", Urumqi: "CN",
    Bucharest: "RO", Sofia: "BG", Belgrade: "RS", Sarajevo: "BA", Podgorica: "ME", Skopje: "MK", Tirane: "AL", Chisinau: "MD", Kyiv: "UA", Kiev: "UA", Tbilisi: "GE", Yerevan: "AM", Baku: "AZ", Istanbul: "TR", Sao_Paulo: "BR", Bahia: "BR", Fortaleza: "BR", Recife: "BR", Manaus: "BR", Mexico_City: "MX", Monterrey: "MX", Tijuana: "MX", Cancun: "MX",
    Buenos_Aires: "AR", Bogota: "CO", Lima: "PE", Guayaquil: "EC", Costa_Rica: "CR", Panama: "PA", Santo_Domingo: "DO", Johannesburg: "ZA", Bangkok: "TH", Kuala_Lumpur: "MY", Almaty: "KZ", Tashkent: "UZ", Tunis: "TN", Casablanca: "MA", Jamaica: "JM",
    Kolkata: "IN", Calcutta: "IN", Jakarta: "ID", Makassar: "ID", Manila: "PH", Ho_Chi_Minh: "VN", Saigon: "VN", Karachi: "PK", Dhaka: "BD", Colombo: "LK", Kathmandu: "NP", Cairo: "EG", Lagos: "NG", Nairobi: "KE", Accra: "GH", Addis_Ababa: "ET", Dar_es_Salaam: "TZ", Kampala: "UG", La_Paz: "BO", Asuncion: "PY", Phnom_Penh: "KH", Yangon: "MM", Vientiane: "LA", Caracas: "VE",
    Moscow: "RU", Kaliningrad: "RU", Samara: "RU", Yekaterinburg: "RU", Novosibirsk: "RU", Krasnoyarsk: "RU", Irkutsk: "RU", Vladivostok: "RU", Minsk: "BY", Tehran: "IR", Havana: "CU", Damascus: "SY" };
  const tierOf = c => Object.keys(ZONES).find(k => ZONES[k].split(" ").includes(c)) || "B";
  const known = Object.values(ZONES).join(" ").split(" ");
  function guess() {
    try { const s = localStorage.getItem("rr-cty"); if (s && known.includes(s)) return s } catch { }
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").split("/").pop();
    if (TZ[tz]) return TZ[tz];
    for (const l of navigator.languages || [navigator.language]) { const r = (l.split("-")[1] || "").toUpperCase(); if (known.includes(r)) return r }
    return "DE" }
  /* rounded the way prices look in shops there: 99, 149, 799 … or €3, $3.50, CHF 45 */
  const LAD = [1, 1.2, 1.5, 1.9, 2.5, 2.9, 3.5, 3.9, 4.5, 4.9, 5.5, 5.9, 6.5, 6.9, 7.9, 8.9, 9.9];
  function pretty(x, cur) {
    if (WHOLE.has(cur)) { const k = Math.pow(10, Math.floor(Math.log10(x)) - 1), C = [10, 12, 15, 19, 25, 29, 35, 39, 45, 49, 59, 69, 79, 99].map(v => v * k), b = C.reduce((a, v) => Math.abs(Math.log(v / x)) < Math.abs(Math.log(a / x)) ? v : a); return b >= 100 && b % 10 === 0 && cur !== "JPY" && cur !== "KRW" ? b - 1 : b }
    if (x < 10) return Math.max(1, Math.round(x * 2) / 2);
    const k = Math.pow(10, Math.floor(Math.log10(x)) - 1) * 10; return LAD.reduce((a, v) => Math.abs(Math.log(v * k / x)) < Math.abs(Math.log(a / x)) ? v * k : a, k) }
  const P = {
    cty: guess(), lang: "en",
    get tier() { return tierOf(this.cty) },
    get cur() { return ["DE", "AT", "NL", "BE", "FR", "IE", "FI", "ES", "IT", "PT", "GR", "CY", "MT", "SI", "HR", "SK", "EE", "LV", "LT", "LU", "ME"].includes(this.cty) ? "EUR" : (CUR[this.cty] || "EUR") },
    eur(plan) { return (TIERS[this.tier] || TIERS.B)[plan] },
    fmt(plan) {
      const e = this.eur(plan), c = this.cur, loc = this.lang + "-" + this.cty;
      const v = c === "EUR" ? e : pretty(e * (RATE[c] || 1), c);
      const f = new Intl.NumberFormat(loc, { style: "currency", currency: c, minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: v % 1 ? 2 : 0 }).format(v);
      return f },
    euro(plan) { const e = this.eur(plan); return new Intl.NumberFormat(this.lang, { style: "currency", currency: "EUR", minimumFractionDigits: e % 1 ? 2 : 0 }).format(e) },
    buy(plan) { const B = (window.IRR && IRR.buy) || {}; return this.tier === "X" ? "" : ((B[this.tier] || {})[plan] || (B.B || {})[plan] || B[plan] || "") },
    countries() { return known },
    set(c) { this.cty = c; try { localStorage.setItem("rr-cty", c) } catch { } window.renderPrices && renderPrices() }
  };
  window.PRICE = P;
})();
