import { Language, Currency } from '../types';

const BENGALI_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

const HINDI_DIGITS: Record<string, string> = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
};

const URDU_DIGITS: Record<string, string> = {
  '0': '۰',
  '1': '۱',
  '2': '۲',
  '3': '۳',
  '4': '۴',
  '5': '۵',
  '6': '۶',
  '7': '۷',
  '8': '۸',
  '9': '۹',
};

/**
 * Converts any string or number containing 0-9 digits to localized digits based on the selected language.
 * E.g., for language = 'bn', "10" -> "১০", "25.00" -> "২৫.০০", 150 -> "১৫০".
 */
export function toLocalizedDigits(val: string | number | null | undefined, language?: Language | string): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  const lang = language || 'bn';
  if (lang === 'bn') {
    return str.replace(/[0-9]/g, (d) => BENGALI_DIGITS[d] || d);
  }
  if (lang === 'hi') {
    return str.replace(/[0-9]/g, (d) => HINDI_DIGITS[d] || d);
  }
  if (lang === 'ur') {
    return str.replace(/[0-9]/g, (d) => URDU_DIGITS[d] || d);
  }
  return str;
}

export interface FormatMoneyOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  decimals?: number;
}

/**
 * Formats a USD base amount into the user's selected currency with language-aware digits.
 * E.g., for USD $0.0833 (৳10) in 'bn': "৳ ১০.০০"
 * E.g., for USD $0.0833 (৳10) in 'en': "৳ 10.00"
 */
export function formatMoney(
  usdAmount: number,
  currency: Currency = 'BDT',
  language?: Language | string,
  options?: FormatMoneyOptions
): string {
  const lang = (language as Language) || 'bn';
  const validUsd = Number(usdAmount) || 0;
  let decimals = options?.decimals;
  let numericVal = 0;
  let symbol = '৳';
  let code = 'BDT';

  if (currency === 'BDT') {
    numericVal = validUsd * 120;
    symbol = '৳';
    code = 'BDT';
    if (decimals === undefined) decimals = 2;
  } else if (currency === 'INR') {
    numericVal = validUsd * 87;
    symbol = '₹';
    code = 'INR';
    if (decimals === undefined) decimals = 2;
  } else {
    numericVal = validUsd;
    symbol = '$';
    code = 'USD';
    if (decimals === undefined) {
      decimals = numericVal > 0 && numericVal < 0.01 ? 4 : 2;
    }
  }

  const rawFormatted = numericVal.toFixed(decimals);
  const localizedNum = toLocalizedDigits(rawFormatted, lang);

  const showSym = options?.showSymbol !== false;
  const showCod = options?.showCode ? ` ${code}` : '';

  if (showSym) {
    return `${symbol} ${localizedNum}${showCod}`;
  }
  return `${localizedNum}${showCod}`;
}

/**
 * Formats a raw currency amount (already in BDT, USD, or INR) into localized digits with symbol.
 * E.g. formatRawCurrency(25, 'BDT', 'bn') => "৳ ২৫.০০"
 */
export function formatRawCurrency(
  amount: number,
  currency: Currency = 'BDT',
  language: Language = 'bn',
  options?: FormatMoneyOptions
): string {
  const decimals = options?.decimals ?? 2;
  let symbol = '৳';
  if (currency === 'INR') symbol = '₹';
  if (currency === 'USD') symbol = '$';

  const localizedNum = toLocalizedDigits(amount.toFixed(decimals), language);
  const showSym = options?.showSymbol !== false;
  const showCod = options?.showCode ? ` ${currency}` : '';

  if (showSym) {
    return `${symbol} ${localizedNum}${showCod}`;
  }
  return `${localizedNum}${showCod}`;
}
