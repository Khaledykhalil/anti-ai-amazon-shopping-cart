import { browser } from 'wxt/browser';
import {
  FilterCategoryConfig,
  FilterCategoryId,
  FilterEvaluation,
  FilterResult,
  ProductNode,
  UserPreferences
} from '../engine/types';
import { isDropshipAlphabetSoupBrand } from './entropy';
import {
  evaluateAISlop,
  evaluateLowTrustOrNSFW,
  evaluateSponsoredAd,
  evaluateUltraProcessed
} from './heuristics';

// Category Configurations
export const FILTER_METADATA: Record<FilterCategoryId, FilterCategoryConfig> = {
  bds_boycott: {
    id: 'bds_boycott',
    name: 'Geopolitical & Ethical Boycotts',
    shortDescription: 'BDS & Corporate human rights watchlists',
    icon: '🍉',
    defaultAction: 'blur',
    defaultEnabled: true,
    color: '#ef4444'
  },
  ai_slop: {
    id: 'ai_slop',
    name: 'AI Slop & Synthetic Imagery',
    shortDescription: 'Midjourney art, AI apparel, & prompt-leak listings',
    icon: '🤖',
    defaultAction: 'blur',
    defaultEnabled: true,
    color: '#8b5cf6'
  },
  dropship_junk: {
    id: 'dropship_junk',
    name: 'Alphabet-Soup Dropshippers',
    shortDescription: 'Unpronounceable trademark-farm white-label brands',
    icon: '📦',
    defaultAction: 'blur',
    defaultEnabled: true,
    color: '#f59e0b'
  },
  sponsored_ads: {
    id: 'sponsored_ads',
    name: 'Sponsored Ads & Paid Placements',
    shortDescription: 'Paid search ads and promoted carousels',
    icon: '📢',
    defaultAction: 'dim',
    defaultEnabled: true,
    color: '#3b82f6'
  },
  house_brands: {
    id: 'house_brands',
    name: 'Monopoly House Brands',
    shortDescription: 'Amazon Basics, Great Value, Kirkland & private labels',
    icon: '🏢',
    defaultAction: 'blur',
    defaultEnabled: true,
    color: '#64748b'
  },
  fast_fashion: {
    id: 'fast_fashion',
    name: 'Ultra-Fast Fashion Hazards',
    shortDescription: 'Shein, Temu, Romwe & 100% virgin-synthetic apparel',
    icon: '👗',
    defaultAction: 'blur',
    defaultEnabled: true,
    color: '#ec4899'
  },
  labor_violations: {
    id: 'labor_violations',
    name: 'Forced Labor & Sweatshops',
    shortDescription: 'DOL, CBP Withhold Release Orders, & ASPI watchlists',
    icon: '⛓️',
    defaultAction: 'blur',
    defaultEnabled: true,
    color: '#dc2626'
  },
  animal_testing: {
    id: 'animal_testing',
    name: 'Non-Cruelty-Free / Animal Testing',
    shortDescription: 'Parent conglomerates conducting animal testing',
    icon: '🐇',
    defaultAction: 'blur',
    defaultEnabled: true,
    color: '#d97706'
  },
  ultra_processed: {
    id: 'ultra_processed',
    name: 'Ultra-Processed (NOVA 4) Foods',
    shortDescription: 'High-Fructose Corn Syrup, synthetic dyes & additives',
    icon: '🧪',
    defaultAction: 'blur',
    defaultEnabled: false,
    color: '#059669'
  },
  low_trust_nsfw: {
    id: 'low_trust_nsfw',
    name: 'Counterfeit Risk & Family Shield',
    shortDescription: 'Low rating velocity, unverified sellers & NSFW items',
    icon: '🔞',
    defaultAction: 'blur',
    defaultEnabled: true,
    color: '#7c3aed'
  }
};

export interface BrandEntry {
  brand: string;
  parent?: string;
  aliases?: string[];
  reason: string;
  citation?: string;
  platform?: string;
}

// In-memory list cache
let boycottsList: BrandEntry[] = [];
let environmentList: BrandEntry[] = [];
let laborList: BrandEntry[] = [];
let crueltyFreeList: BrandEntry[] = [];
let houseBrandsList: BrandEntry[] = [];
let listsLoaded = false;

/**
 * Initialize or load static lists
 */
export async function loadFilterDatabases(): Promise<void> {
  if (listsLoaded) return;

  const fetchList = async (path: string): Promise<BrandEntry[]> => {
    try {
      if (typeof browser !== 'undefined' && browser.runtime?.getURL) {
        const url = (browser.runtime.getURL as (p: string) => string)(path);
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          return json.entries || [];
        }
      }
    } catch {
      // In tests or non-extension context, fallback to dynamic import
    }

    try {
      if (path.includes('boycotts')) {
        const mod = await import('../../public/lists/boycotts.json');
        return mod.default.entries || [];
      }
      if (path.includes('environment')) {
        const mod = await import('../../public/lists/environment.json');
        return mod.default.entries || [];
      }
      if (path.includes('labor')) {
        const mod = await import('../../public/lists/labor.json');
        return mod.default.entries || [];
      }
      if (path.includes('cruelty_free')) {
        const mod = await import('../../public/lists/cruelty_free.json');
        return mod.default.entries || [];
      }
      if (path.includes('house_brands')) {
        const mod = await import('../../public/lists/house_brands.json');
        return mod.default.entries || [];
      }
    } catch (err) {
      console.warn(`Blurify: Could not load ${path}`, err);
    }
    return [];
  };

  const [b, e, l, c, h] = await Promise.all([
    fetchList('lists/boycotts.json'),
    fetchList('lists/environment.json'),
    fetchList('lists/labor.json'),
    fetchList('lists/cruelty_free.json'),
    fetchList('lists/house_brands.json')
  ]);

  boycottsList = b;
  environmentList = e;
  laborList = l;
  crueltyFreeList = c;
  houseBrandsList = h;
  listsLoaded = true;
}

/**
 * Checks if a product brand or title matches any entry in a list
 */
function matchBrandInList(brand: string, title: string, list: BrandEntry[]): BrandEntry | null {
  const normBrand = (brand || '').toLowerCase().trim();
  const normTitle = (title || '').toLowerCase().trim();

  for (const entry of list) {
    const entryBrand = entry.brand.toLowerCase();
    // Direct brand match
    if (normBrand && (normBrand === entryBrand || normBrand.includes(entryBrand) || entryBrand.includes(normBrand))) {
      return entry;
    }
    // Check aliases
    if (entry.aliases) {
      for (const alias of entry.aliases) {
        const normAlias = alias.toLowerCase();
        if (normBrand && normBrand === normAlias) {
          return entry;
        }
        // Match in title with word boundaries
        const regex = new RegExp(`\\b${normAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(normTitle)) {
          return entry;
        }
      }
    }
    // Match entry brand in title
    if (entryBrand.length >= 4) {
      const regex = new RegExp(`\\b${entryBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(normTitle)) {
        return entry;
      }
    }
  }

  return null;
}

/**
 * Master evaluation function that scores any ProductNode against all 10 categories
 */
export async function evaluateProduct(
  product: ProductNode,
  preferences: UserPreferences
): Promise<FilterResult> {
  if (!preferences.masterEnabled) {
    return { isFiltered: false, allEvaluations: [] };
  }

  await loadFilterDatabases();

  const evaluations: FilterEvaluation[] = [];
  const brand = product.brand.trim();
  const title = product.title.trim();
  const rawText = product.rawText;

  // 1. Check custom whitelist
  const isWhitelisted = preferences.customAllowedBrands.some(
    (b) => b.toLowerCase() === brand.toLowerCase()
  );
  if (isWhitelisted) {
    return { isFiltered: false, allEvaluations: [] };
  }

  // 2. Check custom blocklist
  const isCustomBlocked = preferences.customBlockedBrands.some(
    (b) => b.toLowerCase() === brand.toLowerCase()
  );
  if (isCustomBlocked) {
    const action = 'blur';
    evaluations.push({
      matched: true,
      categoryId: 'low_trust_nsfw',
      reason: `Custom Blocklist: Brand "${brand}" manually blocked by you`,
      confidence: 1.0,
      action
    });
  }

  // 3. Category: BDS & Ethical Boycotts
  if (preferences.filters.bds_boycott?.enabled) {
    const match = matchBrandInList(brand, title, boycottsList);
    if (match) {
      evaluations.push({
        matched: true,
        categoryId: 'bds_boycott',
        reason: match.reason,
        citation: match.citation,
        parentCompany: match.parent,
        confidence: 0.95,
        action: preferences.filters.bds_boycott.action
      });
    }
  }

  // 4. Category: AI Slop & Synthetic Content
  if (preferences.filters.ai_slop?.enabled) {
    const aiCheck = evaluateAISlop(rawText, title, product.imageUrl);
    if (aiCheck.isAI) {
      evaluations.push({
        matched: true,
        categoryId: 'ai_slop',
        reason: aiCheck.reason || 'AI-generated photography or listing text',
        confidence: aiCheck.confidence,
        action: preferences.filters.ai_slop.action
      });
    }
  }

  // 5. Category: Alphabet-Soup Dropshipper Brands
  if (preferences.filters.dropship_junk?.enabled && brand) {
    const entropyCheck = isDropshipAlphabetSoupBrand(brand);
    if (entropyCheck.isDropship) {
      evaluations.push({
        matched: true,
        categoryId: 'dropship_junk',
        reason: entropyCheck.reason || 'Trademark-farm alphabet-soup dropshipper brand',
        confidence: entropyCheck.confidence,
        action: preferences.filters.dropship_junk.action
      });
    }
  }

  // 6. Category: Sponsored Ads
  if (preferences.filters.sponsored_ads?.enabled) {
    const adCheck = evaluateSponsoredAd(product.isSponsored, product.badges, rawText);
    if (adCheck.isSponsored) {
      evaluations.push({
        matched: true,
        categoryId: 'sponsored_ads',
        reason: adCheck.reason || 'Sponsored marketplace placement',
        confidence: adCheck.confidence,
        action: preferences.filters.sponsored_ads.action
      });
    }
  }

  // 7. Category: House Brands & Retailer Monopolies
  if (preferences.filters.house_brands?.enabled) {
    const houseMatch = matchBrandInList(brand, title, houseBrandsList);
    if (houseMatch) {
      evaluations.push({
        matched: true,
        categoryId: 'house_brands',
        reason: houseMatch.reason,
        citation: houseMatch.citation,
        parentCompany: houseMatch.parent,
        confidence: 0.95,
        action: preferences.filters.house_brands.action
      });
    }
  }

  // 8. Category: Fast Fashion & Environmental Hazards
  if (preferences.filters.fast_fashion?.enabled) {
    const envMatch = matchBrandInList(brand, title, environmentList);
    if (envMatch) {
      evaluations.push({
        matched: true,
        categoryId: 'fast_fashion',
        reason: envMatch.reason,
        citation: envMatch.citation,
        parentCompany: envMatch.parent,
        confidence: 0.92,
        action: preferences.filters.fast_fashion.action
      });
    }
  }

  // 9. Category: Labor Violations & Forced Labor Watchlist
  if (preferences.filters.labor_violations?.enabled) {
    const laborMatch = matchBrandInList(brand, title, laborList);
    if (laborMatch) {
      evaluations.push({
        matched: true,
        categoryId: 'labor_violations',
        reason: laborMatch.reason,
        citation: laborMatch.citation,
        parentCompany: laborMatch.parent,
        confidence: 0.95,
        action: preferences.filters.labor_violations.action
      });
    }
  }

  // 10. Category: Non-Cruelty-Free & Animal Testing
  if (preferences.filters.animal_testing?.enabled) {
    const cfMatch = matchBrandInList(brand, title, crueltyFreeList);
    if (cfMatch) {
      evaluations.push({
        matched: true,
        categoryId: 'animal_testing',
        reason: cfMatch.reason,
        citation: cfMatch.citation,
        parentCompany: cfMatch.parent,
        confidence: 0.90,
        action: preferences.filters.animal_testing.action
      });
    }
  }

  // 11. Category: Ultra-Processed Foods (NOVA 4)
  if (preferences.filters.ultra_processed?.enabled) {
    const upCheck = evaluateUltraProcessed(`${title} ${rawText}`);
    if (upCheck.isUltraProcessed) {
      evaluations.push({
        matched: true,
        categoryId: 'ultra_processed',
        reason: upCheck.reason || 'NOVA Group 4 ultra-processed food additives',
        confidence: upCheck.confidence,
        action: preferences.filters.ultra_processed.action
      });
    }
  }

  // 12. Category: Low Trust & NSFW Shield
  if (preferences.filters.low_trust_nsfw?.enabled) {
    const lowTrustCheck = evaluateLowTrustOrNSFW({
      rating: product.rating,
      reviewCount: product.reviewCount,
      rawText,
      title
    });
    if (lowTrustCheck.isLowTrust) {
      evaluations.push({
        matched: true,
        categoryId: 'low_trust_nsfw',
        reason: lowTrustCheck.reason || 'Low trust review velocity or adult content',
        confidence: lowTrustCheck.confidence,
        action: preferences.filters.low_trust_nsfw.action
      });
    }
  }

  // Pick primary evaluation with highest confidence
  evaluations.sort((a, b) => b.confidence - a.confidence);
  const isFiltered = evaluations.length > 0;

  return {
    isFiltered,
    primaryEvaluation: evaluations[0],
    allEvaluations: evaluations
  };
}
