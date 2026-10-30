import { ProductNode } from '../types';

export function isAmazon(): boolean {
  if (typeof window === 'undefined') return false;
  return /amazon\.(com|co\.uk|ca|de|fr|it|es|co\.jp|in|com\.au|com\.mx)/i.test(window.location.hostname);
}

export function extractAmazonProducts(): ProductNode[] {
  const nodes: ProductNode[] = [];
  const cards = document.querySelectorAll<HTMLElement>(
    'div[data-component-type="s-search-result"], .s-result-item[data-asin]:not([data-asin=""])'
  );

  cards.forEach((card) => {
    const asin = card.getAttribute('data-asin') || '';
    if (!asin) return;

    const titleEl = card.querySelector<HTMLElement>('h2 a span, h2 span, .a-size-medium.a-color-base');
    const title = titleEl?.textContent?.trim() || '';
    if (!title) return;

    // Brand extraction
    const brandEl = card.querySelector<HTMLElement>(
      '.a-size-mini.a-color-secondary, .s-line-clamp-1 .a-size-base-plus, h5.s-line-clamp-1 span'
    );
    let brand = brandEl?.textContent?.trim() || '';

    // If brand not found, extract from title prefix (e.g. "BrandName Men's Shirt")
    if (!brand && title) {
      const words = title.split(' ');
      if (words.length > 0 && words[0]) {
        brand = words[0];
      }
    }

    // Price extraction
    const priceEl = card.querySelector<HTMLElement>('.a-price .a-offscreen, .a-price-whole');
    const priceText = priceEl?.textContent?.trim();

    // Image extraction
    const imgEl = card.querySelector<HTMLImageElement>('img.s-image, [data-component-type="s-product-image"] img');
    const imageUrl = imgEl?.src;

    // Sponsored check
    const isSponsored = !!card.querySelector(
      '.puis-sponsored-label-text, [data-component-type="sp-sponsored-result"], .s-sponsored-label-text'
    );

    // Badges
    const badges: string[] = [];
    if (isSponsored) badges.push('Sponsored');
    card.querySelectorAll('.a-badge-text').forEach((b) => {
      if (b.textContent) badges.push(b.textContent.trim());
    });

    // Rating
    let rating: number | undefined;
    const ratingEl = card.querySelector<HTMLElement>('.a-icon-star-small .a-icon-alt, [aria-label*="stars"]');
    if (ratingEl?.textContent) {
      const match = ratingEl.textContent.match(/([0-9.]+)\s+out of/i);
      if (match && match[1]) rating = parseFloat(match[1]);
    }

    // Review count
    let reviewCount: number | undefined;
    const reviewEl = card.querySelector<HTMLElement>('span[aria-label*="ratings"], span.a-size-base.s-underline-text');
    if (reviewEl?.textContent) {
      const cleanCount = reviewEl.textContent.replace(/[^0-9]/g, '');
      if (cleanCount) reviewCount = parseInt(cleanCount, 10);
    }

    nodes.push({
      element: card,
      id: `amazon-${asin}`,
      platform: 'amazon',
      title,
      brand,
      priceText,
      imageUrl,
      isSponsored,
      badges,
      rawText: card.innerText || '',
      rating,
      reviewCount
    });
  });

  return nodes;
}
