export type PlatformType =
  | 'amazon'
  | 'ebay'
  | 'walmart'
  | 'target'
  | 'bestbuy'
  | 'etsy'
  | 'aliexpress'
  | 'temu'
  | 'shein'
  | 'homedepot'
  | 'lowes'
  | 'costco'
  | 'wayfair'
  | 'shopify'
  | 'woocommerce'
  | 'magento'
  | 'bigcommerce'
  | 'squarespace'
  | 'generic';

export interface ProductNode {
  element: HTMLElement;
  id: string;
  platform: PlatformType;
  title: string;
  brand: string;
  seller?: string;
  priceText?: string;
  imageUrl?: string;
  isSponsored: boolean;
  badges: string[];
  rawText: string;
  rating?: number;
  reviewCount?: number;
}

export type FilterAction = 'blur' | 'dim' | 'hide';

export type FilterCategoryId =
  | 'bds_boycott'
  | 'ai_slop'
  | 'dropship_junk'
  | 'sponsored_ads'
  | 'house_brands'
  | 'fast_fashion'
  | 'labor_violations'
  | 'animal_testing'
  | 'ultra_processed'
  | 'low_trust_nsfw';

export interface FilterEvaluation {
  matched: boolean;
  categoryId: FilterCategoryId;
  reason: string;
  citation?: string;
  parentCompany?: string;
  confidence: number;
  action: FilterAction;
}

export interface FilterResult {
  isFiltered: boolean;
  primaryEvaluation?: FilterEvaluation;
  allEvaluations: FilterEvaluation[];
}

export interface FilterCategoryConfig {
  id: FilterCategoryId;
  name: string;
  shortDescription: string;
  icon: string; // Emoji
  defaultAction: FilterAction;
  defaultEnabled: boolean;
  color: string;
}

export interface FilterSettings {
  enabled: boolean;
  action: FilterAction;
}

export interface UserPreferences {
  masterEnabled: boolean;
  blurIntensity: number; // 4 to 24 px, default 12
  universalStoreMode: boolean; // optional host permissions
  filters: Record<FilterCategoryId, FilterSettings>;
  customBlockedBrands: string[];
  customAllowedBrands: string[];
  customKeywords: string[];
}

export interface TabStats {
  url: string;
  totalProductsScanned: number;
  totalFiltered: number;
  byCategory: Record<FilterCategoryId, number>;
}
