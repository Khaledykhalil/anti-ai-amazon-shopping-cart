import { AIDetectionResult, FilteringMode, UserSettings } from '../shared/types';
import { fetchCustomerPhotosForAsin, swapWithRealPhoto } from './realPhotos';
import { incrementStat } from '../shared/storage';

/**
 * Creates the search results filter banner atop Amazon search page
 */
export function injectSearchFilterBar(
  container: Element,
  stats: { aiCount: number; totalScanned: number },
  settings: UserSettings,
  onModeChange: (newMode: FilteringMode) => void
): HTMLElement {
  let existing = document.getElementById('anti-ai-search-banner');
  if (existing) {
    const countEl = existing.querySelector('.anti-ai-banner-count');
    if (countEl) countEl.textContent = `${stats.aiCount} AI items filtered`;
    return existing;
  }

  const banner = document.createElement('div');
  banner.id = 'anti-ai-search-banner';
  banner.className = 'anti-ai-search-banner';

  banner.innerHTML = `
    <div class="anti-ai-banner-left">
      <span class="anti-ai-shield-icon">🛡️</span>
      <span class="anti-ai-banner-title">Anti-AI Amazon Cart</span>
      <span class="anti-ai-banner-badge anti-ai-banner-count">${stats.aiCount} AI items detected</span>
    </div>
    <div class="anti-ai-banner-controls">
      <label class="anti-ai-mode-label">Filter Action:</label>
      <select class="anti-ai-mode-select" id="anti-ai-banner-mode-select">
        <option value="blur" ${settings.mode === 'blur' ? 'selected' : ''}>Blur & Warn</option>
        <option value="hide" ${settings.mode === 'hide' ? 'selected' : ''}>Hide Listings</option>
        <option value="replace-real" ${settings.mode === 'replace-real' ? 'selected' : ''}>Real Photos Only</option>
      </select>
      <button type="button" class="anti-ai-toggle-all-btn" id="anti-ai-toggle-all">Toggle View</button>
    </div>
  `;

  const select = banner.querySelector<HTMLSelectElement>('#anti-ai-banner-mode-select');
  select?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value as FilteringMode;
    onModeChange(val);
  });

  const toggleBtn = banner.querySelector('#anti-ai-toggle-all');
  toggleBtn?.addEventListener('click', () => {
    document.body.classList.toggle('anti-ai-temporarily-revealed');
  });

  container.prepend(banner);
  return banner;
}

/**
 * Apply AI overlay/shield to an Amazon search card or cart item
 */
export function applyAIShield(
  card: HTMLElement,
  img: HTMLImageElement,
  detection: AIDetectionResult,
  asin: string,
  settings: UserSettings
): void {
  // Prevent duplicate tagging
  if (card.dataset.antiAiProcessed === 'true') return;
  card.dataset.antiAiProcessed = 'true';
  card.dataset.antiAiIsAi = detection.isAI ? 'true' : 'false';

  if (!detection.isAI) return;

  // Add root marker classes
  card.classList.add('anti-ai-flagged-card');
  card.classList.add(`anti-ai-mode-${settings.mode}`);

  // Image wrapper
  const imgParent = img.parentElement;
  if (!imgParent) return;

  imgParent.classList.add('anti-ai-image-wrapper');

  // Create Shield Overlay
  const overlay = document.createElement('div');
  overlay.className = 'anti-ai-shield-overlay';

  const reasonListHtml = detection.reasons.length > 0
    ? `<ul class="anti-ai-reasons-list">${detection.reasons.slice(0, 2).map(r => `<li>${r}</li>`).join('')}</ul>`
    : '';

  overlay.innerHTML = `
    <div class="anti-ai-overlay-content">
      <div class="anti-ai-warning-pill">
        <span class="anti-ai-warn-emoji">⚠️</span>
        <span class="anti-ai-warn-text">AI Photography Detected</span>
        <span class="anti-ai-conf-score">${Math.round(detection.confidence * 100)}%</span>
      </div>
      ${reasonListHtml}
      <div class="anti-ai-overlay-actions">
        <button type="button" class="anti-ai-btn anti-ai-btn-real" title="Load genuine buyer photos">
          📸 Swap to Real Buyer Photo
        </button>
        <button type="button" class="anti-ai-btn anti-ai-btn-peek" title="Temporarily unblur this item">
          👁️ Show Anyway
        </button>
      </div>
    </div>
  `;

  // Attach button actions
  const peekBtn = overlay.querySelector('.anti-ai-btn-peek');
  peekBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    card.classList.toggle('anti-ai-unveiled');
  });

  const swapBtn = overlay.querySelector('.anti-ai-btn-real');
  swapBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    swapBtn.textContent = '⏳ Loading buyer photo...';
    const photos = await fetchCustomerPhotosForAsin(asin);
    if (photos.length > 0) {
      swapWithRealPhoto(img, photos[0], card);
      card.classList.add('anti-ai-unveiled');
      incrementStat('realPhotosSwapped');
    } else {
      swapBtn.textContent = '❌ No buyer photos found';
      setTimeout(() => {
        swapBtn.textContent = '📸 Swap to Real Buyer Photo';
      }, 2500);
    }
  });

  // Auto-swap if setting is 'replace-real'
  if (settings.mode === 'replace-real' && asin) {
    fetchCustomerPhotosForAsin(asin).then((photos) => {
      if (photos.length > 0) {
        swapWithRealPhoto(img, photos[0], card);
        incrementStat('realPhotosSwapped');
      }
    });
  }

  imgParent.appendChild(overlay);

  // If mode is 'hide', add an unhide bar
  const collapsedBar = document.createElement('div');
  collapsedBar.className = 'anti-ai-hidden-bar';
  collapsedBar.innerHTML = `
    <span>🚫 1 AI-Generated Listing Hidden (${Math.round(detection.confidence * 100)}% AI confidence)</span>
    <button type="button" class="anti-ai-unhide-btn">Show</button>
  `;
  collapsedBar.querySelector('.anti-ai-unhide-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    card.classList.remove(`anti-ai-mode-hide`);
    card.classList.add('anti-ai-mode-blur');
    collapsedBar.remove();
  });
  card.prepend(collapsedBar);
}

/**
 * Injects a detailed authenticity card on the Amazon product detail page
 */
export function injectDetailBanner(
  container: Element,
  detection: AIDetectionResult,
  asin: string
): void {
  if (document.getElementById('anti-ai-detail-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'anti-ai-detail-banner';
  banner.className = 'anti-ai-detail-banner';

  const isAi = detection.isAI;
  const statusColor = isAi ? 'anti-ai-status-flagged' : 'anti-ai-status-verified';
  const statusIcon = isAi ? '⚠️' : '✅';
  const statusTitle = isAi ? 'Suspected AI-Generated Photography' : 'Verified Natural Photography';

  banner.innerHTML = `
    <div class="anti-ai-detail-header ${statusColor}">
      <div class="anti-ai-detail-icon">${statusIcon}</div>
      <div class="anti-ai-detail-title-group">
        <h3 class="anti-ai-detail-title">${statusTitle}</h3>
        <p class="anti-ai-detail-subtitle">Anti-AI Shopping Authenticity Inspector • Confidence: ${Math.round(detection.confidence * 100)}%</p>
      </div>
    </div>
    ${
      detection.reasons.length > 0
        ? `<div class="anti-ai-detail-reasons">
            <strong>Detection Signals:</strong>
            <ul>${detection.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
          </div>`
        : ''
    }
    <div class="anti-ai-detail-customer-photos" id="anti-ai-customer-gallery">
      <div class="anti-ai-gallery-header">
        <span>📸 Real Customer Photos from Verified Buyers:</span>
        <span class="anti-ai-gallery-status" id="anti-ai-gallery-status">Scanning buyer photos...</span>
      </div>
      <div class="anti-ai-gallery-grid" id="anti-ai-gallery-grid"></div>
    </div>
  `;

  container.prepend(banner);

  // Populate Customer Photos Gallery
  fetchCustomerPhotosForAsin(asin).then((photos) => {
    const grid = banner.querySelector('#anti-ai-gallery-grid');
    const status = banner.querySelector('#anti-ai-gallery-status');
    if (!grid || !status) return;

    if (photos.length === 0) {
      status.textContent = 'No buyer photos available yet for this item.';
      return;
    }

    status.textContent = `${photos.length} real buyer photos found:`;
    grid.innerHTML = photos.slice(0, 6).map((p, idx) => `
      <div class="anti-ai-gallery-item" data-photo-url="${p.url}">
        <img src="${p.thumbnailUrl || p.url}" alt="Customer photo ${idx + 1}" loading="lazy" />
        <span class="anti-ai-gallery-click-hint">Use as Main Photo</span>
      </div>
    `).join('');

    // Clicking any real photo replaces the main Amazon hero image!
    const heroImg = document.querySelector<HTMLImageElement>('#landingImage, #imgTagWrapperId img');
    grid.querySelectorAll('.anti-ai-gallery-item').forEach((item) => {
      item.addEventListener('click', () => {
        const photoUrl = item.getAttribute('data-photo-url');
        if (photoUrl && heroImg) {
          heroImg.src = photoUrl;
          heroImg.srcset = '';
          incrementStat('realPhotosSwapped');
        }
      });
    });
  });
}
