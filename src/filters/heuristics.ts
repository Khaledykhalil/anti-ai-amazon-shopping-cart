// AI Slop Prompt Leakage & Generative Cliché Patterns
export const AI_PROMPT_LEAKAGE_REGEX = /(photorealistic|8k resolution|unreal engine|octane render|trending on artstation|hyperrealistic|highly detailed studio lighting|masterpiece|--v\s+[4-6]|--ar\s+[0-9:]+|dall-?e|midjourney|chatgpt|stable diffusion)/i;

export const AI_MARKETING_CLICHES = [
  'a testament to',
  'delve into',
  'seamless blend',
  'seamlessly blends',
  'elevate your style',
  'elevate your everyday',
  'elevate your experience',
  'unparalleled quality',
  'meticulously crafted',
  'crafted with precision',
  'embodies the essence',
  'game changer',
  'revolutionary design',
  'cutting-edge technology',
  'perfect harmony',
  'rich tapestry',
  'transcend ordinary',
  'look no further than',
  'sophistication meets'
];

export const AI_BOOK_SUBTITLE_PATTERNS = [
  /everything you need to know about/i,
  /a comprehensive guide (to|for)/i,
  /the ultimate beginner('?s)? guide/i,
  /mastering .* (in \d+ days|step by step)/i,
  /unlock the secrets of/i,
  /made simple: a complete/i
];

export const NOVA_4_MARKERS = [
  'high fructose corn syrup',
  'high-fructose corn syrup',
  'hfcs',
  'hydrogenated oil',
  'hydrogenated palm',
  'hydrogenated soybean',
  'partially hydrogenated',
  'red 40',
  'yellow 5',
  'yellow 6',
  'blue 1',
  'blue 2',
  'titanium dioxide',
  'potassium bromate',
  'butylated hydroxyanisole',
  'bha',
  'butylated hydroxytoluene',
  'bht',
  'sodium benzoate',
  'azodicarbonamide',
  'monosodium glutamate',
  'polysorbate 60',
  'polysorbate 80',
  'sodium nitrite',
  'sodium nitrate',
  'artificial flavor',
  'artificial colour',
  'artificial color'
];

export const NSFW_ADULT_KEYWORDS = [
  'adult toy',
  'erotic',
  'vibrator',
  'dildo',
  'masturbat',
  'sexy lingerie',
  'bdsm',
  'fetish',
  'anal plug',
  'bullet vibrator'
];

/**
 * Evaluates whether product text or attributes match AI-generated content patterns
 */
export function evaluateAISlop(text: string, title: string, imageUrl?: string): {
  isAI: boolean;
  reason?: string;
  confidence: number;
} {
  const fullText = `${title} ${text}`.toLowerCase();

  // 1. Prompt leakage test
  const promptMatch = fullText.match(AI_PROMPT_LEAKAGE_REGEX);
  if (promptMatch) {
    return {
      isAI: true,
      reason: `AI prompt leakage detected: "${promptMatch[0]}"`,
      confidence: 0.95
    };
  }

  // 2. Generic AI-generated book subtitles (common on Amazon KDP slop)
  for (const pattern of AI_BOOK_SUBTITLE_PATTERNS) {
    if (pattern.test(title)) {
      return {
        isAI: true,
        reason: 'Formulaic AI-generated book title pattern',
        confidence: 0.85
      };
    }
  }

  // 3. Image URL synthetic markers
  if (imageUrl) {
    const lowerUrl = imageUrl.toLowerCase();
    if (/(ai-model|virtual-model|synthetic|generated-image|c4d-render|flux-dev)/i.test(lowerUrl)) {
      return {
        isAI: true,
        reason: 'Image CDN flags synthetic / AI-rendered asset',
        confidence: 0.90
      };
    }
  }

  // 4. Marketing cliché density
  let count = 0;
  const matchedCliches: string[] = [];
  for (const cliche of AI_MARKETING_CLICHES) {
    if (fullText.includes(cliche)) {
      count++;
      matchedCliches.push(cliche);
    }
  }

  if (count >= 2) {
    return {
      isAI: true,
      reason: `High density of LLM marketing clichés: "${matchedCliches.slice(0, 2).join('", "')}"`,
      confidence: Math.min(0.9, 0.6 + count * 0.1)
    };
  }

  return { isAI: false, confidence: 0 };
}

/**
 * Scans food listings for NOVA-4 ultra-processed food additives
 */
export function evaluateUltraProcessed(text: string): {
  isUltraProcessed: boolean;
  reason?: string;
  confidence: number;
} {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const marker of NOVA_4_MARKERS) {
    if (lower.includes(marker)) {
      found.push(marker);
    }
  }

  if (found.length > 0) {
    return {
      isUltraProcessed: true,
      reason: `NOVA Group 4 ultra-processed additives found: ${found.slice(0, 3).join(', ')}`,
      confidence: 0.95
    };
  }

  return { isUltraProcessed: false, confidence: 0 };
}

/**
 * Checks for sponsored / paid search ad placements
 */
export function evaluateSponsoredAd(
  isSponsoredFlag: boolean,
  badges: string[],
  rawText: string
): {
  isSponsored: boolean;
  reason?: string;
  confidence: number;
} {
  if (isSponsoredFlag) {
    return { isSponsored: true, reason: 'Paid marketplace sponsorship', confidence: 1.0 };
  }

  for (const badge of badges) {
    if (/sponsored|promoted|ad\b|featured placement/i.test(badge)) {
      return { isSponsored: true, reason: `Sponsored placement badge: "${badge}"`, confidence: 1.0 };
    }
  }

  if (/^(sponsored|promoted|ad\b)/i.test(rawText.trim())) {
    return { isSponsored: true, reason: 'Sponsored listing header', confidence: 0.95 };
  }

  return { isSponsored: false, confidence: 0 };
}

/**
 * Checks for low trust, counterfeit indicators, or adult content
 */
export function evaluateLowTrustOrNSFW(params: {
  rating?: number;
  reviewCount?: number;
  rawText: string;
  title: string;
}): {
  isLowTrust: boolean;
  reason?: string;
  confidence: number;
} {
  const { rating, reviewCount, rawText, title } = params;
  const full = `${title} ${rawText}`.toLowerCase();

  // NSFW / Adult Filter
  for (const kw of NSFW_ADULT_KEYWORDS) {
    if (full.includes(kw)) {
      return {
        isLowTrust: true,
        reason: `Adult / NSFW item flagged: "${kw}"`,
        confidence: 0.95
      };
    }
  }

  // Low rating check
  if (rating !== undefined && rating > 0 && rating < 3.2 && (reviewCount || 0) >= 10) {
    return {
      isLowTrust: true,
      reason: `Severely low customer satisfaction: ${rating.toFixed(1)}/5 stars (${reviewCount} reviews)`,
      confidence: 0.85
    };
  }

  return { isLowTrust: false, confidence: 0 };
}
