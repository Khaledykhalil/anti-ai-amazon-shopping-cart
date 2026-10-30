// Curated whitelist of legitimate heritage acronyms and short brands
export const LEGITIMATE_ACRONYMS = new Set([
  'ASUS', 'SONY', 'LEGO', 'ANKER', 'IKEA', 'NIKE', 'BOSE', 'LG', 'HP',
  'AMD', 'JBL', 'MSI', 'EVGA', 'DJI', 'VIZIO', 'TCL', 'HTC', 'JVC',
  'NEC', 'CAT', 'TDK', 'IBM', '3M', 'GAP', 'REI', 'UGG', 'VANS', 'PUMA',
  'SEIKO', 'CASIO', 'CANON', 'NIKON', 'DELL', 'ACER', 'BENQ', 'SENNHEISER',
  'LOGITECH', 'CORSAIR', 'RAZER', 'STEELSERIES', 'SHURE', 'YAMAHA', 'ROLAND',
  'KORG', 'PIONEER', 'DENON', 'MARANTZ', 'PANASONIC', 'SHARP', 'HITACHI',
  'TOSHIBA', 'FUJITSU', 'SANYO', 'EPSON', 'BROTHER', 'XEROX', 'RICOH',
  'KYOCERA', 'LEXMARK', 'GARMIN', 'FITBIT', 'POLAR', 'SUUNTO', 'WACOM',
  'BROADCOM', 'QUALCOMM', 'NVIDIA', 'INTEL', 'APPLE', 'GOOGLE', 'MICROSOFT',
  'SAMSUNG'
]);

/**
 * Calculates Shannon entropy of a string
 */
export function calculateShannonEntropy(str: string): number {
  if (!str) return 0;
  const len = str.length;
  const frequencies = new Map<string, number>();

  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Detects whether a brand name has phonetic characteristics of a random
 * alphabet-soup trademark-farm generator (e.g. "ZXQWTY", "VBNMK", "QWERTYU", "ZKPK", "B09X-PRO")
 */
export function isDropshipAlphabetSoupBrand(rawBrand: string): {
  isDropship: boolean;
  reason?: string;
  confidence: number;
} {
  if (!rawBrand) {
    return { isDropship: false, confidence: 0 };
  }

  const clean = rawBrand.trim();
  const alphanumericOnly = clean.replace(/[^a-zA-Z0-9]/g, '');
  const upper = clean.toUpperCase();
  const upperAlphaNum = alphanumericOnly.toUpperCase();

  // 1. Check whitelist first
  if (LEGITIMATE_ACRONYMS.has(upperAlphaNum) || LEGITIMATE_ACRONYMS.has(upper)) {
    return { isDropship: false, confidence: 0 };
  }

  // 2. Short established names (under 4 chars)
  if (alphanumericOnly.length < 4) {
    return { isDropship: false, confidence: 0 };
  }

  // 3. Four or more uppercase letters with zero vowels
  const lettersOnly = upperAlphaNum.replace(/[0-9]/g, '');
  const vowels = lettersOnly.match(/[AEIOUY]/g) || [];
  const vowelRatio = lettersOnly.length > 0 ? vowels.length / lettersOnly.length : 0;
  const consonantsOnly = /^[B-DF-HJ-NP-TV-Z]+$/i.test(lettersOnly);

  if (lettersOnly.length >= 4 && consonantsOnly) {
    return {
      isDropship: true,
      reason: `Alphabet-soup trademark: 0 vowels in "${rawBrand}"`,
      confidence: 0.95
    };
  }

  // 4. Alphanumeric factory code pattern (e.g. "B09X-PRO", "X8-TECH", "A1-PLUS")
  if (/[A-Z]+[0-9]+[A-Z]+/i.test(upperAlphaNum) || (/[0-9]/.test(upper) && vowelRatio < 0.20 && lettersOnly.length >= 4)) {
    return {
      isDropship: true,
      reason: `Factory catalog code brand name pattern: "${rawBrand}"`,
      confidence: 0.85
    };
  }

  // 5. Consecutive consonant clusters (4 or more in a row)
  const consecutiveConsonants = lettersOnly.match(/[B-DF-HJ-NP-TV-XZ]{4,}/g);
  if (consecutiveConsonants && lettersOnly.length <= 10) {
    const match = consecutiveConsonants[0];
    const isCommonPhoneme = /^(SCH|STR|THR|GHT|DGE|PHR)/i.test(match);
    if (!isCommonPhoneme && vowelRatio < 0.20) {
      return {
        isDropship: true,
        reason: `Unpronounceable consonant cluster "${match}" in "${rawBrand}"`,
        confidence: 0.88
      };
    }
  }

  // 6. Low vowel ratio across 5-10 chars
  if (lettersOnly.length >= 5 && lettersOnly.length <= 10 && vowelRatio < 0.18) {
    return {
      isDropship: true,
      reason: `Trademark-farm entropy pattern (only ${vowels.length} vowel in ${lettersOnly.length} chars)`,
      confidence: 0.82
    };
  }

  // 7. Suspicious generic factory prefixes/suffixes
  if (/(direct-?us|official-?store|factory-?direct|trade-?co|sz-|hk-)/i.test(rawBrand)) {
    return {
      isDropship: true,
      reason: `Generic white-label factory brand naming pattern: "${rawBrand}"`,
      confidence: 0.75
    };
  }

  return { isDropship: false, confidence: 0 };
}
