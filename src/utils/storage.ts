import { storage } from 'wxt/utils/storage';
import { FilterCategoryId, UserPreferences, TabStats } from '../engine/types';

export const FILTER_CATEGORIES: FilterCategoryId[] = [
  'bds_boycott',
  'ai_slop',
  'dropship_junk',
  'sponsored_ads',
  'house_brands',
  'fast_fashion',
  'labor_violations',
  'animal_testing',
  'ultra_processed',
  'low_trust_nsfw'
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  masterEnabled: true,
  blurIntensity: 12,
  universalStoreMode: false,
  filters: {
    bds_boycott: { enabled: true, action: 'blur' },
    ai_slop: { enabled: true, action: 'blur' },
    dropship_junk: { enabled: true, action: 'blur' },
    sponsored_ads: { enabled: true, action: 'dim' },
    house_brands: { enabled: true, action: 'blur' },
    fast_fashion: { enabled: true, action: 'blur' },
    labor_violations: { enabled: true, action: 'blur' },
    animal_testing: { enabled: true, action: 'blur' },
    ultra_processed: { enabled: false, action: 'blur' }, // opt-in
    low_trust_nsfw: { enabled: true, action: 'blur' }
  },
  customBlockedBrands: [],
  customAllowedBrands: [],
  customKeywords: []
};

// Storage keys
const PREFS_KEY = 'local:blurify_preferences';
const STATS_KEY = 'local:blurify_tab_stats';

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const raw = await storage.getItem<UserPreferences>(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return {
      ...DEFAULT_PREFERENCES,
      ...raw,
      filters: {
        ...DEFAULT_PREFERENCES.filters,
        ...(raw.filters || {})
      }
    };
  } catch (err) {
    console.warn('Blurify: Could not read storage preferences, using defaults', err);
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  try {
    await storage.setItem(PREFS_KEY, prefs);
  } catch (err) {
    console.error('Blurify: Failed to save preferences', err);
  }
}

export async function updatePreferences(partial: Partial<UserPreferences>): Promise<UserPreferences> {
  const current = await getPreferences();
  const updated: UserPreferences = {
    ...current,
    ...partial,
    filters: {
      ...current.filters,
      ...(partial.filters || {})
    }
  };
  await savePreferences(updated);
  return updated;
}

export async function addBrandToWhitelist(brand: string): Promise<UserPreferences> {
  if (!brand) return getPreferences();
  const current = await getPreferences();
  const clean = brand.trim();
  const exists = current.customAllowedBrands.some(
    (b) => b.toLowerCase() === clean.toLowerCase()
  );
  if (!exists) {
    current.customAllowedBrands.push(clean);
    // Remove from blocked if present
    current.customBlockedBrands = current.customBlockedBrands.filter(
      (b) => b.toLowerCase() !== clean.toLowerCase()
    );
    await savePreferences(current);
  }
  return current;
}

export async function addBrandToBlocklist(brand: string): Promise<UserPreferences> {
  if (!brand) return getPreferences();
  const current = await getPreferences();
  const clean = brand.trim();
  const exists = current.customBlockedBrands.some(
    (b) => b.toLowerCase() === clean.toLowerCase()
  );
  if (!exists) {
    current.customBlockedBrands.push(clean);
    current.customAllowedBrands = current.customAllowedBrands.filter(
      (b) => b.toLowerCase() !== clean.toLowerCase()
    );
    await savePreferences(current);
  }
  return current;
}

export async function getTabStats(): Promise<TabStats> {
  try {
    const stats = await storage.getItem<TabStats>(STATS_KEY);
    if (stats) return stats;
  } catch {
    // Ignore
  }
  return {
    url: typeof window !== 'undefined' ? window.location.hostname : '',
    totalProductsScanned: 0,
    totalFiltered: 0,
    byCategory: {
      bds_boycott: 0,
      ai_slop: 0,
      dropship_junk: 0,
      sponsored_ads: 0,
      house_brands: 0,
      fast_fashion: 0,
      labor_violations: 0,
      animal_testing: 0,
      ultra_processed: 0,
      low_trust_nsfw: 0
    }
  };
}

export async function setTabStats(stats: TabStats): Promise<void> {
  try {
    await storage.setItem(STATS_KEY, stats);
  } catch (err) {
    console.error('Blurify: Could not set tab stats', err);
  }
}

export function subscribePreferences(callback: (prefs: UserPreferences) => void): () => void {
  return storage.watch<UserPreferences>(PREFS_KEY, (newVal) => {
    if (newVal) {
      callback({
        ...DEFAULT_PREFERENCES,
        ...newVal,
        filters: {
          ...DEFAULT_PREFERENCES.filters,
          ...(newVal.filters || {})
        }
      });
    }
  });
}
