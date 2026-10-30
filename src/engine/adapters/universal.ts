import { ProductNode } from '../types';

export const PRICE_REGEX = /(\$|€|£|¥|USD|CAD|GBP|AUD)\s?\d+([.,]\d{2})?/i;

/**
 * Universal Fallback 1: Schema.org Microdata & JSON-LD
 */
export function extractSchemaOrgProducts(): ProductNode[] {
  const nodes: ProductNode[] = [];
  const items = document.querySelectorAll<HTMLElement>('[itemtype*="schema.org/Product"]');

  items.forEach((item, idx) => {
    const titleEl = item.querySelector<HTMLElement>('[itemprop="name"]');
    const title = titleEl?.textContent?.trim() || '';
    if (!title) return;

    const brandEl = item.querySelector<HTMLElement>('[itemprop="brand"]');
    const brand = brandEl?.textContent?.trim() || title.split(' ')[0] || '';

    const priceEl = item.querySelector<HTMLElement>('[itemprop="price"], [itemprop="offers"] [itemprop="price"]');
    const priceText = priceEl?.textContent?.trim();

    const imgEl = item.querySelector<HTMLImageElement>('[itemprop="image"], img');
    const imageUrl = imgEl?.src;

    nodes.push({
      element: item,
      id: `schema-${idx}`,
      platform: 'generic',
      title,
      brand,
      priceText,
      imageUrl,
      isSponsored: false,
      badges: [],
      rawText: item.innerText || ''
    });
  });

  return nodes;
}

/**
 * Universal Fallback 2: Visual Card Heuristic
 * Checks for 3+ sibling containers with:
 * 1. An image (>80x80)
 * 2. A heading/link (10-180 characters)
 * 3. A price pattern
 */
export function extractVisualHeuristicProducts(): ProductNode[] {
  const nodes: ProductNode[] = [];
  // Candidate containers
  const potentialParents = document.querySelectorAll<HTMLElement>(
    'ul, ol, div[class*="grid"], div[class*="list"], div[class*="products"]'
  );

  potentialParents.forEach((parent) => {
    const children = Array.from(parent.children) as HTMLElement[];
    if (children.length < 3) return;

    const matchedCards: ProductNode[] = [];

    children.forEach((child, idx) => {
      // 1. Image check
      const img = child.querySelector<HTMLImageElement>('img');
      if (!img) return;
      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && (rect.width < 60 || rect.height < 60)) return;

      // 2. Price check
      const text = child.innerText || '';
      const priceMatch = text.match(PRICE_REGEX);
      if (!priceMatch) return;

      // 3. Title check
      const headingOrLink = child.querySelector<HTMLElement>('h1, h2, h3, h4, h5, a[href*="product"], a');
      const title = headingOrLink?.textContent?.trim() || '';
      if (title.length < 8 || title.length > 200) return;

      const brand = title.split(' ')[0] || '';

      matchedCards.push({
        element: child,
        id: `universal-${idx}`,
        platform: 'generic',
        title,
        brand,
        priceText: priceMatch[0],
        imageUrl: img.src,
        isSponsored: /sponsored|promoted|ad\b/i.test(text),
        badges: [],
        rawText: text
      });
    });

    if (matchedCards.length >= 3) {
      nodes.push(...matchedCards);
    }
  });

  return nodes;
}

export function extractUniversalProducts(): ProductNode[] {
  const schemaNodes = extractSchemaOrgProducts();
  if (schemaNodes.length >= 2) {
    return schemaNodes;
  }
  return extractVisualHeuristicProducts();
}
