import { ProductNode } from '../types';

export function isEbay(): boolean {
  if (typeof window === 'undefined') return false;
  return /ebay\.(com|co\.uk|ca|de|fr|com\.au)/i.test(window.location.hostname);
}

export function extractEbayProducts(): ProductNode[] {
  const nodes: ProductNode[] = [];
  const cards = document.querySelectorAll<HTMLElement>(
    '.s-item, li.s-item, li[data-view*="mi:1686"], .srp-results .s-item'
  );

  cards.forEach((card, idx) => {
    const titleEl = card.querySelector<HTMLElement>('.s-item__title, .x-item-title');
    const title = titleEl?.textContent?.trim() || '';
    if (!title || title.toLowerCase() === 'shop on ebay') return;

    // Price
    const priceEl = card.querySelector<HTMLElement>('.s-item__price');
    const priceText = priceEl?.textContent?.trim();

    // Image
    const imgEl = card.querySelector<HTMLImageElement>('.s-item__image-wrapper img, img.s-item__image-img');
    const imageUrl = imgEl?.src;

    // Sponsored
    const isSponsored = /sponsored/i.test(card.innerText || '');

    // Seller / Brand
    const sellerEl = card.querySelector<HTMLElement>('.s-item__seller-info-text');
    const seller = sellerEl?.textContent?.trim();
    const brand = title.split(' ')[0] || '';

    // Badges
    const badges: string[] = [];
    if (isSponsored) badges.push('Sponsored');

    nodes.push({
      element: card,
      id: `ebay-${card.getAttribute('id') || idx}`,
      platform: 'ebay',
      title,
      brand,
      seller,
      priceText,
      imageUrl,
      isSponsored,
      badges,
      rawText: card.innerText || ''
    });
  });

  return nodes;
}
