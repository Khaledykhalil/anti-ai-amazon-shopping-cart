import { RealCustomerPhoto } from '../shared/types';
import { AMAZON_SELECTORS } from '../shared/constants';

// In-memory cache of ASIN -> Real Customer Photos
const realPhotosCache = new Map<string, RealCustomerPhoto[]>();

/**
 * Extract real customer review photos present in the current DOM (on product detail pages)
 */
export function extractDetailCustomerPhotos(): RealCustomerPhoto[] {
  const photos: RealCustomerPhoto[] = [];
  const foundUrls = new Set<string>();

  const imageElements = document.querySelectorAll<HTMLImageElement>(AMAZON_SELECTORS.customerReviewImages);
  
  imageElements.forEach((img) => {
    // Look for high-resolution version or thumbnail
    let fullUrl = img.getAttribute('data-src') || img.src;
    
    // Convert Amazon thumbnail URL to higher resolution if possible (e.g., _SX70_ -> _SX600_)
    if (fullUrl && fullUrl.includes('._S')) {
      fullUrl = fullUrl.replace(/\._[A-Z0-9_,]+_\./i, '._SX800_.');
    }

    if (fullUrl && !foundUrls.has(fullUrl)) {
      foundUrls.add(fullUrl);
      photos.push({
        url: fullUrl,
        thumbnailUrl: img.src,
        reviewerName: img.closest('.a-section')?.querySelector('.a-profile-name')?.textContent?.trim(),
        verifiedPurchase: true
      });
    }
  });

  return photos;
}

/**
 * Fetch customer review photos for a specific ASIN
 */
export async function fetchCustomerPhotosForAsin(asin: string): Promise<RealCustomerPhoto[]> {
  if (!asin) return [];
  if (realPhotosCache.has(asin)) {
    return realPhotosCache.get(asin)!;
  }

  try {
    const reviewsUrl = `https://${window.location.hostname}/product-reviews/${asin}/ref=cm_cr_arp_d_viewopt_sr?filterByTypes=images_only`;
    const response = await fetch(reviewsUrl, { credentials: 'same-origin' });
    if (!response.ok) return [];

    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const photos: RealCustomerPhoto[] = [];
    const imgs = doc.querySelectorAll<HTMLImageElement>('img[alt*="Customer image"], img.review-image-tile');

    imgs.forEach((img) => {
      let src = img.getAttribute('data-src') || img.src;
      if (src && src.includes('._S')) {
        src = src.replace(/\._[A-Z0-9_,]+_\./i, '._SX800_.');
      }
      if (src && !photos.some(p => p.url === src)) {
        photos.push({
          url: src,
          thumbnailUrl: img.src,
          verifiedPurchase: true
        });
      }
    });

    realPhotosCache.set(asin, photos);
    return photos;
  } catch (err) {
    console.warn(`Anti-AI: Could not load customer photos for ${asin}`, err);
    return [];
  }
}

/**
 * Swap an AI image element with a genuine customer photo
 */
export function swapWithRealPhoto(
  imgElement: HTMLImageElement,
  customerPhoto: RealCustomerPhoto,
  cardContainer?: HTMLElement
): void {
  // Store original src on element if not already preserved
  if (!imgElement.dataset.originalAiSrc) {
    imgElement.dataset.originalAiSrc = imgElement.src;
  }

  imgElement.src = customerPhoto.url;
  imgElement.srcset = ''; // Clear responsive srcset so custom real photo displays
  imgElement.classList.add('anti-ai-real-photo-active');

  if (cardContainer) {
    cardContainer.classList.add('anti-ai-swapped');
    let badge = cardContainer.querySelector('.anti-ai-badge-buyer-photo');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'anti-ai-badge-buyer-photo';
      badge.innerHTML = `
        <span class="anti-ai-badge-icon">📸</span>
        <span>Showing Real Buyer Photo</span>
        <button type="button" class="anti-ai-revert-btn" title="View original listing image">Revert</button>
      `;
      const revertBtn = badge.querySelector('.anti-ai-revert-btn');
      revertBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        revertToOriginalPhoto(imgElement, cardContainer);
      });
      imgElement.parentElement?.appendChild(badge);
    }
  }
}

/**
 * Revert back to original image
 */
export function revertToOriginalPhoto(
  imgElement: HTMLImageElement,
  cardContainer?: HTMLElement
): void {
  if (imgElement.dataset.originalAiSrc) {
    imgElement.src = imgElement.dataset.originalAiSrc;
    imgElement.classList.remove('anti-ai-real-photo-active');
  }
  if (cardContainer) {
    cardContainer.classList.remove('anti-ai-swapped');
    const badge = cardContainer.querySelector('.anti-ai-badge-buyer-photo');
    badge?.remove();
  }
}
