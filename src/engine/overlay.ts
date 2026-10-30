import { FilterEvaluation, ProductNode, UserPreferences } from './types';
import { FILTER_METADATA } from '../filters/registry';
import { addBrandToWhitelist } from '../utils/storage';

const SHADOW_HOST_TAG = 'blurify-overlay-host';

/**
 * Applies blur, dim, or hide styling and injects an isolated Shadow DOM pill overlay
 */
export function applyFilterAction(
  product: ProductNode,
  evaluation: FilterEvaluation,
  preferences: UserPreferences,
  onWhitelisted?: (brand: string) => void
): void {
  const el = product.element;
  const action = evaluation.action;
  const meta = FILTER_METADATA[evaluation.categoryId];
  const intensity = preferences.blurIntensity || 12;

  // Cleanup existing overlay if any
  removeFilterAction(product);

  el.dataset.blurifyAction = action;
  el.dataset.blurifyCategory = evaluation.categoryId;

  // 1. Action: Hide
  if (action === 'hide') {
    el.style.setProperty('display', 'none', 'important');
    return;
  }

  // 2. Action: Dim
  if (action === 'dim') {
    el.style.setProperty('opacity', '0.35', 'important');
    el.style.setProperty('filter', 'grayscale(60%)', 'important');
    el.style.setProperty('transition', 'opacity 0.2s ease, filter 0.2s ease', 'important');
  }

  // 3. Action: Blur
  if (action === 'blur') {
    el.style.setProperty('position', 'relative', 'important');

    // Blur internal images and texts, but keep container interactable
    const mediaTargets = el.querySelectorAll<HTMLElement>('img, picture, video, .s-image, [class*="image"]');
    if (mediaTargets.length > 0) {
      mediaTargets.forEach((m) => {
        m.style.setProperty('filter', `blur(${intensity}px)`, 'important');
        m.style.setProperty('transition', 'filter 0.2s ease', 'important');
      });
    } else {
      el.style.setProperty('filter', `blur(${intensity}px)`, 'important');
    }
  }

  // Inject Shadow DOM Host Element
  const host = document.createElement(SHADOW_HOST_TAG);
  host.style.position = 'absolute';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '100%';
  host.style.height = '100%';
  host.style.zIndex = '9999';
  host.style.pointerEvents = 'none'; // allow click-through except on interactive pill

  const shadow = host.attachShadow({ mode: 'open' });

  // Shadow DOM internal styles & template
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    }

    .overlay-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      pointer-events: auto;
    }

    .glass-pill {
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
      border-radius: 12px;
      padding: 10px 14px;
      max-width: 92%;
      color: #f8fafc;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 6px;
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes popIn {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .pill-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }

    .pill-icon {
      font-size: 16px;
    }

    .pill-category {
      color: #ffffff;
    }

    .pill-reason {
      font-size: 11px;
      color: #cbd5e1;
      line-height: 1.35;
      max-height: 52px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pill-parent {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 500;
    }

    .pill-citation {
      color: #38bdf8;
      text-decoration: none;
      font-size: 10px;
      font-weight: 600;
      margin-top: 2px;
    }

    .pill-citation:hover {
      text-decoration: underline;
    }

    .btn-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 4px;
    }

    .action-btn {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.22);
      color: #f1f5f9;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s ease, transform 0.1s ease;
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.22);
      transform: translateY(-1px);
    }

    .action-btn-allow {
      background: rgba(16, 185, 129, 0.25);
      border-color: rgba(16, 185, 129, 0.5);
      color: #a7f3d0;
    }

    .action-btn-allow:hover {
      background: rgba(16, 185, 129, 0.45);
    }
  `;

  const wrapper = document.createElement('div');
  wrapper.className = 'overlay-wrapper';

  const categoryName = meta?.name || 'Filtered Item';
  const icon = meta?.icon || '🛡️';
  const parentNotice = evaluation.parentCompany
    ? `<div class="pill-parent">Parent Conglomerate: ${evaluation.parentCompany}</div>`
    : '';
  const citationNotice = evaluation.citation
    ? `<a href="${evaluation.citation}" target="_blank" rel="noopener noreferrer" class="pill-citation">Source Evidence ↗</a>`
    : '';

  wrapper.innerHTML = `
    <div class="glass-pill">
      <div class="pill-header">
        <span class="pill-icon">${icon}</span>
        <span class="pill-category">${categoryName}</span>
      </div>
      <div class="pill-reason">${evaluation.reason}</div>
      ${parentNotice}
      ${citationNotice}
      <div class="btn-row">
        <button type="button" class="action-btn" id="btn-peek" title="Temporarily unblur this item">
          👁️ Peek
        </button>
        ${
          product.brand
            ? `<button type="button" class="action-btn action-btn-allow" id="btn-whitelist" title="Always allow ${product.brand}">
                ✓ Allow Brand
              </button>`
            : ''
        }
      </div>
    </div>
  `;

  // Attach Peek Button Listener
  const peekBtn = wrapper.querySelector('#btn-peek');
  peekBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const mediaTargets = el.querySelectorAll<HTMLElement>('img, picture, video, .s-image, [class*="image"]');
    const isCurrentlyBlurred = el.dataset.blurifyPeeked !== 'true';

    if (isCurrentlyBlurred) {
      // Unblur
      mediaTargets.forEach((m) => m.style.setProperty('filter', 'none', 'important'));
      el.style.setProperty('filter', 'none', 'important');
      el.style.setProperty('opacity', '1', 'important');
      host.style.setProperty('opacity', '0.2', 'important');
      el.dataset.blurifyPeeked = 'true';
    } else {
      // Re-blur
      mediaTargets.forEach((m) => m.style.setProperty('filter', `blur(${intensity}px)`, 'important'));
      host.style.setProperty('opacity', '1', 'important');
      el.dataset.blurifyPeeked = 'false';
    }
  });

  // Attach Whitelist Button Listener
  const whitelistBtn = wrapper.querySelector('#btn-whitelist');
  whitelistBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (product.brand) {
      await addBrandToWhitelist(product.brand);
      removeFilterAction(product);
      onWhitelisted?.(product.brand);
    }
  });

  shadow.appendChild(styleEl);
  shadow.appendChild(wrapper);
  el.appendChild(host);
}

/**
 * Completely removes Blurify styling, filter effects, and shadow hosts from a product
 */
export function removeFilterAction(product: ProductNode): void {
  const el = product.element;
  delete el.dataset.blurifyAction;
  delete el.dataset.blurifyCategory;
  delete el.dataset.blurifyPeeked;

  // Reset styles
  el.style.removeProperty('display');
  el.style.removeProperty('opacity');
  el.style.removeProperty('filter');
  el.style.removeProperty('position');
  el.style.removeProperty('transition');

  const mediaTargets = el.querySelectorAll<HTMLElement>('img, picture, video, .s-image, [class*="image"]');
  mediaTargets.forEach((m) => {
    m.style.removeProperty('filter');
    m.style.removeProperty('transition');
  });

  const existingHost = el.querySelector(SHADOW_HOST_TAG);
  existingHost?.remove();
}
