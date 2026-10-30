import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { getPreferences, savePreferences, DEFAULT_PREFERENCES } from '../utils/storage';

export default defineBackground(() => {
  // Lifecycle setup
  browser.runtime.onInstalled.addListener(async (details: { reason: string }) => {
    if (details.reason === 'install') {
      const prefs = await getPreferences();
      if (!prefs) {
        await savePreferences(DEFAULT_PREFERENCES);
      }
    }

    if (browser.action?.setBadgeBackgroundColor) {
      await browser.action.setBadgeBackgroundColor({ color: '#10b981' });
    }
  });

  // Handle runtime messages
  browser.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (res: any) => void) => {
    if (message.type === 'CHECK_PERMISSIONS') {
      browser.permissions.contains({ origins: ['*://*/*'] }).then((hasAllUrls: boolean) => {
        sendResponse({ hasAllUrls });
      });
      return true; // async
    }

    if (message.type === 'REQUEST_ALL_URLS') {
      browser.permissions.request({ origins: ['*://*/*'] }).then((granted: boolean) => {
        sendResponse({ granted });
      });
      return true;
    }
  });
});
