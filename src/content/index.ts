import { UserSettings } from '../shared/types';
import { AMAZON_SELECTORS } from '../shared/constants';
import { getSettings, incrementStat } from '../shared/storage';
import { detectAIContent } from './detector';
import { applyAIShield, injectDetailBanner, injectSearchFilterBar } from './ui';
import './styles.css';

let currentSettings: UserSettings | null = null;
let aiListingCount = 0;
let totalScannedCount = 0;

/**
 * Scan search results list
 */
async function processSearchPage(): Promise<void> {
  if (!currentSettings || !currentSettings.enabled) return;

  const resultCards = Array.from(document.querySelectorAll<HTMLElement>(AMAZON_SELECTORS.searchResultCard));
  if (resultCards.length === 0) return;

  // Process in small batches to keep the main thread smooth
  const BATCH_SIZE = 6;
  for (let i = 0; i < resultCards.length; i += BATCH_SIZE) {
    const batch = resultCards.slice(i, i + BATCH_SIZE);

    await Promise.race([
      new Promise<void>((resolve) => {
        requestAnimationFrame(async () => {
          for (const card of batch) {
            if (card.dataset.antiAiProcessed === 'true') continue;

            const asin = card.getAttribute('data-asin') || '';
            const img = card.querySelector<HTMLImageElement>(AMAZON_SELECTORS.searchResultImage);
            const titleEl = card.querySelector<HTMLElement>(AMAZON_SELECTORS.searchResultTitle);
            const brandEl = card.querySelector<HTMLElement>(AMAZON_SELECTORS.searchResultBrand);

            const titleText = titleEl?.textContent?.trim() || '';
            const brandText = brandEl?.textContent?.trim() || '';

            // Check if brand is whitelisted
            if (currentSettings?.whitelistedBrands?.some(b => b.toLowerCase() === brandText.toLowerCase())) {
              card.dataset.antiAiProcessed = 'true';
              continue;
            }

            totalScannedCount++;
            incrementStat('listingsScanned');

            const detection = await detectAIContent({
              imageElement: img,
              titleText,
              brandText,
              sensitivity: currentSettings?.sensitivity
            });

            if (detection.isAI) {
              aiListingCount++;
              incrementStat('aiImagesFiltered');
              if (img) {
                applyAIShield(card, img, detection, asin, currentSettings!);
              }
            } else {
              card.dataset.antiAiProcessed = 'true';
            }
          }
          resolve();
        });
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 800))
    ]);
  }

  // Update or inject top banner
  const searchContainer = document.querySelector('#search, .s-desktop-content, .s-matching-dir');
  if (searchContainer && currentSettings) {
    injectSearchFilterBar(
      searchContainer,
      { aiCount: aiListingCount, totalScanned: totalScannedCount },
      currentSettings,
      (newMode) => {
        if (!currentSettings) return;
        currentSettings.mode = newMode;
        // Update class on existing flagged cards
        document.querySelectorAll('.anti-ai-flagged-card').forEach((card) => {
          card.classList.remove('anti-ai-mode-blur', 'anti-ai-mode-hide', 'anti-ai-mode-replace-real');
          card.classList.add(`anti-ai-mode-${newMode}`);
        });
      }
    );
  }

  // Notify background service worker of badge count
  try {
    chrome.runtime.sendMessage({
      type: 'UPDATE_BADGE',
      payload: { count: aiListingCount }
    });
  } catch {
    // Context may be disconnected during reload
  }
}

/**
 * Scan product detail page
 */
async function processDetailPage(): Promise<void> {
  if (!currentSettings || !currentSettings.enabled) return;

  const heroImg = document.querySelector<HTMLImageElement>(AMAZON_SELECTORS.detailMainImage);
  const titleEl = document.querySelector<HTMLElement>('#productTitle');
  const brandEl = document.querySelector<HTMLElement>(AMAZON_SELECTORS.detailBrandLink);
  const bulletsEl = document.querySelector<HTMLElement>(AMAZON_SELECTORS.detailFeatureBullets);

  const titleText = titleEl?.textContent?.trim() || '';
  const brandText = brandEl?.textContent?.trim() || '';
  const bulletsText = bulletsEl?.textContent?.trim() || '';

  // Extract ASIN from URL
  const asinMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/i) ||
                    window.location.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  const asin = asinMatch ? asinMatch[1] : '';

  totalScannedCount++;
  incrementStat('listingsScanned');

  const detection = await detectAIContent({
    imageElement: heroImg,
    titleText,
    brandText,
    bulletsText,
    sensitivity: currentSettings.sensitivity
  });

  if (detection.isAI) {
    aiListingCount++;
    incrementStat('aiImagesFiltered');
  }

  // Inject Authenticity Banner
  const centerCol = document.querySelector('#centerCol, #dp-container, #leftCol');
  if (centerCol) {
    injectDetailBanner(centerCol, detection, asin);
  }

  try {
    chrome.runtime.sendMessage({
      type: 'UPDATE_BADGE',
      payload: { count: aiListingCount }
    });
  } catch {
    // Ignore
  }
}

/**
 * Reactive DOM Observer for dynamic loading / pagination
 */
function setupObserver(): void {
  const isSearchPage = window.location.pathname.includes('/s') || window.location.search.includes('k=');
  const isDetailPage = window.location.pathname.includes('/dp/') || window.location.pathname.includes('/gp/product/');

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (isSearchPage) {
        processSearchPage();
      }
    }, 400);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial immediate run
  if (isDetailPage) {
    processDetailPage();
  } else if (isSearchPage) {
    processSearchPage();
  }
}

// Initialize content script
async function init(): Promise<void> {
  currentSettings = await getSettings();

  // Listen for settings changes sent from popup
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'SETTINGS_UPDATED') {
      currentSettings = msg.payload;
      window.location.reload();
      sendResponse({ status: 'ok' });
    }
    return true;
  });

  setupObserver();
}

// Start when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
