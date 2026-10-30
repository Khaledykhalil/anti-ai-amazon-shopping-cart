import { AIDetectionResult, SensitivityLevel } from '../shared/types';
import { AI_TEXT_BUZZWORDS, AI_IMAGE_INDICATORS, SENSITIVITY_THRESHOLDS } from '../shared/constants';

// Fast heuristic to check for auto-generated consonant soup brand names (e.g., "XKJQZ", "FZVBK")
function isSuspiciousBrandName(brandName: string): boolean {
  if (!brandName) return false;
  const clean = brandName.trim();
  // 4+ uppercase letters with no vowels
  if (/^[B-DF-HJ-NP-TV-Z]{4,}$/i.test(clean)) return true;
  // All uppercase, length 5+, very few vowels (vowel ratio < 15%)
  if (/^[A-Z]{5,}$/.test(clean)) {
    const vowels = (clean.match(/[AEIOUY]/g) || []).length;
    if (vowels / clean.length < 0.15) return true;
  }
  return false;
}

// Check for AI generation buzzwords in product text
function detectAIBuzzwords(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const buzzword of AI_TEXT_BUZZWORDS) {
    if (lower.includes(buzzword)) {
      matched.push(buzzword);
    }
  }
  return matched;
}

// Check image URL, src, and alt attributes for synthetic/AI hints
function checkImageAttributes(img: HTMLImageElement): { isIndicatorFound: boolean; matchedIndicators: string[] } {
  const src = (img.src || '').toLowerCase();
  const alt = (img.alt || '').toLowerCase();
  const matched: string[] = [];

  for (const indicator of AI_IMAGE_INDICATORS) {
    if (src.includes(indicator) || alt.includes(indicator)) {
      matched.push(indicator);
    }
  }

  return {
    isIndicatorFound: matched.length > 0,
    matchedIndicators: matched
  };
}

// Client-side image canvas inspection for AI aesthetic signatures:
// 1. Unnatural smoothness / lack of camera sensor grain
// 2. High-saturation plastic sheen
async function analyzeImagePixels(img: HTMLImageElement): Promise<{
  unnaturalSmoothness: boolean;
  extremeSaturation: boolean;
  scoreBonus: number;
}> {
  return new Promise((resolve) => {
    // If image hasn't loaded or width is 0, skip canvas
    if (!img.complete || img.naturalWidth === 0) {
      resolve({ unnaturalSmoothness: false, extremeSaturation: false, scoreBonus: 0 });
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve({ unnaturalSmoothness: false, extremeSaturation: false, scoreBonus: 0 });
        return;
      }

      const sampleSize = 64;
      canvas.width = sampleSize;
      canvas.height = sampleSize;

      // Create an image clone to avoid cross-origin tainting if possible
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      
      const onImageReady = () => {
        try {
          ctx.drawImage(probe, 0, 0, sampleSize, sampleSize);
          const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
          const data = imageData.data;

          let totalSaturation = 0;
          let highSatPixels = 0;
          let smoothAdjacentCount = 0;
          const pixelCount = sampleSize * sampleSize;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            const sat = max === 0 ? 0 : delta / max;

            totalSaturation += sat;
            if (sat > 0.75) highSatPixels++;

            // Measure micro-contrast with next pixel (sensor noise test)
            if (i + 4 < data.length) {
              const diff = Math.abs(r - data[i + 4]) + Math.abs(g - data[i + 5]) + Math.abs(b - data[i + 6]);
              // Plastic/AI smooth skin tends to have long runs of near-zero micro-variation
              if (diff < 3) smoothAdjacentCount++;
            }
          }

          const avgSat = totalSaturation / pixelCount;
          const smoothRatio = smoothAdjacentCount / pixelCount;
          const extremeSaturation = avgSat > 0.58 || (highSatPixels / pixelCount) > 0.35;
          const unnaturalSmoothness = smoothRatio > 0.42;

          let scoreBonus = 0;
          if (extremeSaturation) scoreBonus += 0.20;
          if (unnaturalSmoothness) scoreBonus += 0.25;

          resolve({ unnaturalSmoothness, extremeSaturation, scoreBonus });
        } catch {
          // CORS error when reading cross-origin image data
          resolve({ unnaturalSmoothness: false, extremeSaturation: false, scoreBonus: 0 });
        }
      };

      probe.onload = onImageReady;
      probe.onerror = () => resolve({ unnaturalSmoothness: false, extremeSaturation: false, scoreBonus: 0 });
      probe.src = img.src;

      // Timeout fallback in case probe doesn't fire
      setTimeout(() => {
        resolve({ unnaturalSmoothness: false, extremeSaturation: false, scoreBonus: 0 });
      }, 400);

    } catch {
      resolve({ unnaturalSmoothness: false, extremeSaturation: false, scoreBonus: 0 });
    }
  });
}

/**
 * Inspect an Amazon product card or detail section for AI-generated imagery and text.
 */
export async function detectAIContent(params: {
  imageElement?: HTMLImageElement | null;
  titleText?: string;
  brandText?: string;
  bulletsText?: string;
  sensitivity?: SensitivityLevel;
}): Promise<AIDetectionResult> {
  const sensitivity = params.sensitivity || 'medium';
  const threshold = SENSITIVITY_THRESHOLDS[sensitivity];

  const reasons: string[] = [];
  let score = 0;

  // 1. Metadata / URL inspection
  let aiModelIndicator = false;
  if (params.imageElement) {
    const { isIndicatorFound, matchedIndicators } = checkImageAttributes(params.imageElement);
    if (isIndicatorFound) {
      aiModelIndicator = true;
      score += 0.45;
      reasons.push(`AI image indicator in metadata: ${matchedIndicators.join(', ')}`);
    }
  }

  // 2. Suspicious Brand Inspection
  const brandSuspicious = isSuspiciousBrandName(params.brandText || '');
  if (brandSuspicious) {
    score += 0.25;
    reasons.push(`Suspicious auto-generated seller brand ("${params.brandText}")`);
  }

  // 3. Text / Marketing Copy Inspection
  const fullText = `${params.titleText || ''} ${params.bulletsText || ''}`;
  const buzzwords = detectAIBuzzwords(fullText);
  if (buzzwords.length > 0) {
    const buzzScore = Math.min(0.40, buzzwords.length * 0.15);
    score += buzzScore;
    reasons.push(`Detected ${buzzwords.length} AI marketing phrases: "${buzzwords.slice(0, 3).join('", "')}"`);
  }

  // 4. Pixel-level Analysis
  let visualSignals = {
    unnaturalSmoothness: false,
    frequencyAnomaly: false,
    extremeSaturation: false
  };

  if (params.imageElement) {
    const visual = await analyzeImagePixels(params.imageElement);
    visualSignals.unnaturalSmoothness = visual.unnaturalSmoothness;
    visualSignals.extremeSaturation = visual.extremeSaturation;
    score += visual.scoreBonus;

    if (visual.unnaturalSmoothness) {
      reasons.push('Unnatural synthetic skin/fabric smoothness (characteristic of AI renderers)');
    }
    if (visual.extremeSaturation) {
      reasons.push('High-saturation artificial dynamic range');
    }
  }

  // Normalized confidence between 0 and 1
  const confidence = Math.min(0.99, Math.max(0.05, score));
  const isAI = confidence >= threshold;

  return {
    isAI,
    confidence,
    reasons,
    visualSignals,
    metadataSignals: {
      suspiciousBrand: brandSuspicious,
      aiBuzzwordsFound: buzzwords,
      aiModelIndicator
    }
  };
}
