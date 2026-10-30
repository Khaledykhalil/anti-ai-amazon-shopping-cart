import { UserSettings, InspectionStats } from './types';
import { DEFAULT_SETTINGS, DEFAULT_STATS } from './constants';

export async function getSettings(): Promise<UserSettings> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      const res = await chrome.storage.sync.get('anti_ai_settings');
      return { ...DEFAULT_SETTINGS, ...(res.anti_ai_settings || {}) };
    }
  } catch (err) {
    console.warn('Anti-AI: Could not read sync storage, falling back', err);
  }

  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const res = await chrome.storage.local.get('anti_ai_settings');
      return { ...DEFAULT_SETTINGS, ...(res.anti_ai_settings || {}) };
    }
  } catch (err) {
    console.error('Anti-AI: Could not read local storage', err);
  }

  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      await chrome.storage.sync.set({ anti_ai_settings: settings });
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ anti_ai_settings: settings });
    }
  } catch (err) {
    console.error('Anti-AI: Failed to save settings', err);
  }
}

export async function getStats(): Promise<InspectionStats> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const res = await chrome.storage.local.get('anti_ai_stats');
      return { ...DEFAULT_STATS, ...(res.anti_ai_stats || {}) };
    }
  } catch (err) {
    console.error('Anti-AI: Failed to get stats', err);
  }
  return DEFAULT_STATS;
}

export async function incrementStat(key: 'listingsScanned' | 'aiImagesFiltered' | 'realPhotosSwapped', delta = 1): Promise<void> {
  try {
    const stats = await getStats();
    stats[key] = (stats[key] || 0) + delta;
    stats.lastUpdated = Date.now();
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ anti_ai_stats: stats });
    }
  } catch (err) {
    console.error('Anti-AI: Failed to increment stat', err);
  }
}
