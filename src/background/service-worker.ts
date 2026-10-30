import { DEFAULT_SETTINGS, DEFAULT_STATS } from '../shared/constants';

// Initialize default settings upon install or update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const existing = await chrome.storage.sync.get('anti_ai_settings');
    if (!existing.anti_ai_settings) {
      await chrome.storage.sync.set({ anti_ai_settings: DEFAULT_SETTINGS });
    }

    const existingStats = await chrome.storage.local.get('anti_ai_stats');
    if (!existingStats.anti_ai_stats) {
      await chrome.storage.local.set({ anti_ai_stats: DEFAULT_STATS });
    }
  }

  // Set default badge appearance
  if (chrome.action?.setBadgeBackgroundColor) {
    await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  }
});

// Ephemeral message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'UPDATE_BADGE') {
        const count = message.payload?.count || 0;
        const tabId = sender.tab?.id;
        if (tabId && chrome.action?.setBadgeText) {
          const badgeText = count > 0 ? String(count) : '';
          await chrome.action.setBadgeText({ tabId, text: badgeText });
        }
        sendResponse({ success: true });
        return;
      }

      if (message.type === 'CLEAR_BADGE') {
        const tabId = sender.tab?.id;
        if (tabId && chrome.action?.setBadgeText) {
          await chrome.action.setBadgeText({ tabId, text: '' });
        }
        sendResponse({ success: true });
        return;
      }
    } catch (err) {
      console.warn('Anti-AI service worker error:', err);
      sendResponse({ success: false, error: String(err) });
    }
  })();

  return true; // Keep message channel open for async response
});
