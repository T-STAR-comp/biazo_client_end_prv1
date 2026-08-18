export type Currency = {
  code: string;
  name: string;
  /** MWK per 1 unit of this currency (e.g. 1750 MWK = 1 USD) */
  mwkPerUnit: number;
  /** ISO 4217 minor units - 0 for JPY, KRW, etc. */
  decimals: number;
};

/**
 * Bank-rate conversion table with MWK (Malawian Kwacha) as the base currency.
 * Rates are MWK per 1 unit of foreign currency for display and checkout.
 */
export const CURRENCIES: Currency[] = [
  { code: "MWK", name: "Malawian Kwacha", mwkPerUnit: 1, decimals: 0 },
  { code: "USD", name: "US Dollar", mwkPerUnit: 1750, decimals: 2 },
  { code: "ZAR", name: "South African Rand", mwkPerUnit: 49, decimals: 2 },
  { code: "EUR", name: "Euro", mwkPerUnit: 1900, decimals: 2 },
  { code: "GBP", name: "British Pound", mwkPerUnit: 2200, decimals: 2 },
  { code: "CAD", name: "Canadian Dollar", mwkPerUnit: 1130, decimals: 2 },
  { code: "AUD", name: "Australian Dollar", mwkPerUnit: 1140, decimals: 2 },
  { code: "NZD", name: "New Zealand Dollar", mwkPerUnit: 1050, decimals: 2 },
  { code: "CHF", name: "Swiss Franc", mwkPerUnit: 2050, decimals: 2 },
  { code: "JPY", name: "Japanese Yen", mwkPerUnit: 6.25, decimals: 0 },
  { code: "CNY", name: "Chinese Yuan", mwkPerUnit: 121, decimals: 2 },
  { code: "INR", name: "Indian Rupee", mwkPerUnit: 10.5, decimals: 2 },
  { code: "BRL", name: "Brazilian Real", mwkPerUnit: 167, decimals: 2 },
  { code: "MXN", name: "Mexican Peso", mwkPerUnit: 51, decimals: 2 },
  { code: "AED", name: "UAE Dirham", mwkPerUnit: 243, decimals: 2 },
  { code: "SAR", name: "Saudi Riyal", mwkPerUnit: 231, decimals: 2 },
  { code: "QAR", name: "Qatari Riyal", mwkPerUnit: 243, decimals: 2 },
  { code: "KES", name: "Kenyan Shilling", mwkPerUnit: 6.85, decimals: 2 },
  { code: "NGN", name: "Nigerian Naira", mwkPerUnit: 0.59, decimals: 0 },
  { code: "EGP", name: "Egyptian Pound", mwkPerUnit: 18, decimals: 2 },
  { code: "MAD", name: "Moroccan Dirham", mwkPerUnit: 88.5, decimals: 2 },
  { code: "TRY", name: "Turkish Lira", mwkPerUnit: 26.25, decimals: 2 },
  { code: "SGD", name: "Singapore Dollar", mwkPerUnit: 654, decimals: 2 },
  { code: "THB", name: "Thai Baht", mwkPerUnit: 25, decimals: 2 },
  { code: "KRW", name: "South Korean Won", mwkPerUnit: 0.65, decimals: 0 },
  { code: "SEK", name: "Swedish Krona", mwkPerUnit: 83, decimals: 2 },
  { code: "NOK", name: "Norwegian Krone", mwkPerUnit: 83, decimals: 2 },
  { code: "BWP", name: "Botswana Pula", mwkPerUnit: 65, decimals: 2 },
  { code: "ZMW", name: "Zambian Kwacha", mwkPerUnit: 33, decimals: 2 },
  { code: "TZS", name: "Tanzanian Shilling", mwkPerUnit: 0.33, decimals: 0 },
  { code: "UGX", name: "Ugandan Shilling", mwkPerUnit: 0.23, decimals: 0 },
  { code: "GHS", name: "Ghanaian Cedi", mwkPerUnit: 67, decimals: 2 },
  { code: "MUR", name: "Mauritian Rupee", mwkPerUnit: 19, decimals: 2 },
  { code: "MZN", name: "Mozambican Metical", mwkPerUnit: 14, decimals: 2 },
];

export const DEFAULT_CURRENCY = "MWK";

const currencyMap = new Map(CURRENCIES.map((c) => [c.code, c]));

/** Legacy quote rates stored as foreign-units-per-MWK. */
const LEGACY_FOREIGN_PER_MWK_MAX = 0.05;

export function normalizeExchangeRate(rate: number): number {
  if (rate > 0 && rate < LEGACY_FOREIGN_PER_MWK_MAX) {
    return 1 / rate;
  }
  return rate;
}

export function getCurrency(code: string): Currency {
  return currencyMap.get(code) ?? currencyMap.get(DEFAULT_CURRENCY)!;
}

export function convertFromMwk(
  amountMwk: number,
  currencyCode: string,
  rateOverrides?: Record<string, number>,
): number {
  const code = currencyCode.toUpperCase();
  if (code === "MWK") return amountMwk;

  const rawRate = rateOverrides?.[code] ?? getCurrency(code).mwkPerUnit;
  const mwkPerUnit = normalizeExchangeRate(rawRate);
  return amountMwk / mwkPerUnit;
}

export function formatPriceFromMwk(
  amountMwk: number,
  currencyCode: string,
  rateOverrides?: Record<string, number>,
): string {
  const currency = getCurrency(currencyCode);
  const converted = convertFromMwk(amountMwk, currencyCode, rateOverrides);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: currency.decimals,
    minimumFractionDigits: currency.decimals === 0 ? 0 : undefined,
  }).format(converted);
}

/** PayChangu charges MWK for kwacha, USD for USD or any other display currency. */
export function resolvePaymentCurrency(displayCurrency: string): "MWK" | "USD" {
  const code = displayCurrency.toUpperCase();
  if (code === "MWK") return "MWK";
  return "USD";
}

/** @deprecated Use convertFromMwk */
export const convertFromZar = convertFromMwk;
/** @deprecated Use formatPriceFromMwk */
export const formatPriceFromZar = formatPriceFromMwk;
