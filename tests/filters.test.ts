import { describe, it, expect } from 'vitest';
import {
  isDropshipAlphabetSoupBrand,
  calculateShannonEntropy,
  LEGITIMATE_ACRONYMS
} from '../src/filters/entropy';
import {
  evaluateAISlop,
  evaluateUltraProcessed,
  evaluateSponsoredAd,
  evaluateLowTrustOrNSFW
} from '../src/filters/heuristics';

describe('Alphabet-Soup Dropship Entropy Filter', () => {
  it('flags unpronounceable consonant-only trademark-farm brands', () => {
    const dropshipExamples = ['ZXQWTY', 'VBNKL', 'QWRTYP', 'XGTRZ', 'B09X-PRO'];
    for (const brand of dropshipExamples) {
      const res = isDropshipAlphabetSoupBrand(brand);
      expect(res.isDropship).toBe(true);
      expect(res.confidence).toBeGreaterThan(0.7);
    }
  });

  it('safely whitelists legitimate heritage acronyms', () => {
    const whitelist = ['ASUS', 'SONY', 'LEGO', 'ANKER', 'NIKE', 'BOSE', 'LG', 'HP', 'IBM', 'AMD'];
    for (const brand of whitelist) {
      expect(LEGITIMATE_ACRONYMS.has(brand)).toBe(true);
      const res = isDropshipAlphabetSoupBrand(brand);
      expect(res.isDropship).toBe(false);
    }
  });

  it('does not flag standard pronounceable brand names', () => {
    const normalBrands = ['Patagonia', 'Nintendo', 'Logitech', 'KitchenAid', 'Samsung', 'Stanley'];
    for (const brand of normalBrands) {
      const res = isDropshipAlphabetSoupBrand(brand);
      expect(res.isDropship).toBe(false);
    }
  });

  it('correctly calculates Shannon entropy', () => {
    expect(calculateShannonEntropy('')).toBe(0);
    expect(calculateShannonEntropy('AAAAAA')).toBe(0);
    expect(calculateShannonEntropy('ABCDEF')).toBeGreaterThan(2.0);
  });
});

describe('AI Slop & Prompt Leakage Detector', () => {
  it('detects prompt leakage keywords in product copy', () => {
    const copy = 'Beautiful modern landscape canvas, masterpiece, 8k resolution, unreal engine, photorealistic lighting';
    const res = evaluateAISlop(copy, 'Canvas Art');
    expect(res.isAI).toBe(true);
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects formulaic AI book titles on self-publishing marketplaces', () => {
    const title = 'Everything You Need to Know About Prompt Engineering in 30 Days';
    const res = evaluateAISlop('', title);
    expect(res.isAI).toBe(true);
    expect(res.reason).toContain('Formulaic AI-generated book');
  });

  it('detects high-density LLM marketing clichés', () => {
    const copy = 'This leather bag is a testament to timeless elegance and seamlessly blends modern aesthetics with utility.';
    const res = evaluateAISlop(copy, 'Leather Handbag');
    expect(res.isAI).toBe(true);
    expect(res.reason).toContain('LLM marketing clichés');
  });

  it('passes authentic organic product copy', () => {
    const copy = '100% organic cotton crewneck sweatshirt. Machine wash cold with like colors. Tumble dry low.';
    const res = evaluateAISlop(copy, 'Classic Sweatshirt');
    expect(res.isAI).toBe(false);
  });
});

describe('NOVA-4 Ultra-Processed Food Detector', () => {
  it('detects artificial dyes and high fructose corn syrup', () => {
    const text = 'Ingredients: Carbonated water, high fructose corn syrup, caramel color, Red 40, Yellow 5, natural flavor.';
    const res = evaluateUltraProcessed(text);
    expect(res.isUltraProcessed).toBe(true);
    expect(res.reason).toContain('NOVA Group 4');
  });

  it('detects hydrogenated oils and titanium dioxide', () => {
    const text = 'Partially hydrogenated soybean oil, sugar, titanium dioxide for whitening.';
    const res = evaluateUltraProcessed(text);
    expect(res.isUltraProcessed).toBe(true);
  });

  it('passes single-ingredient whole foods', () => {
    const text = 'Ingredients: 100% organic rolled oats. No added sugars or preservatives.';
    const res = evaluateUltraProcessed(text);
    expect(res.isUltraProcessed).toBe(false);
  });
});

describe('Sponsored Ads Detector', () => {
  it('flags sponsored items via boolean flag or badges', () => {
    expect(evaluateSponsoredAd(true, [], '').isSponsored).toBe(true);
    expect(evaluateSponsoredAd(false, ['Sponsored', 'Prime'], '').isSponsored).toBe(true);
    expect(evaluateSponsoredAd(false, ['Best Seller'], 'Sponsored result').isSponsored).toBe(true);
    expect(evaluateSponsoredAd(false, ['Best Seller'], 'Regular description').isSponsored).toBe(false);
  });
});

describe('Low Trust & NSFW Shield', () => {
  it('flags adult / NSFW keywords', () => {
    const res = evaluateLowTrustOrNSFW({
      rawText: 'Rechargeable wireless adult toy with waterproof casing',
      title: 'Massager'
    });
    expect(res.isLowTrust).toBe(true);
    expect(res.reason).toContain('Adult / NSFW');
  });

  it('flags items with low star ratings under 3.2 stars', () => {
    const res = evaluateLowTrustOrNSFW({
      rating: 2.8,
      reviewCount: 45,
      rawText: '',
      title: 'USB Cable'
    });
    expect(res.isLowTrust).toBe(true);
    expect(res.reason).toContain('low customer satisfaction');
  });
});
