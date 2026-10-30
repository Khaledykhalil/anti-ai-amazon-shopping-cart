import { PlatformType, ProductNode } from '../types';

export function detectCMSEngine(): {
  isCMS: boolean;
  platform: PlatformType;
  cardSelector: string;
} {
  if (typeof document === 'undefined') {
    return { isCMS: false, platform: 'generic', cardSelector: '' };
  }

  // 1. Shopify
  const hasShopifyObject = typeof (window as any).Shopify !== 'undefined';
  const hasShopifyMeta = !!document.querySelector('meta[name="shopify-digital-wallet"], link[href*="cdn.shopify.com"]');
  const hasShopifyLinks = !!document.querySelector('a[href*="/products/"]');

  if (hasShopifyObject || hasShopifyMeta || hasShopifyLinks) {
    const shopifySelectors = [
      '.product-card',
      '.grid-view-item',
      'li.grid__item',
      'product-card',
      '.product-item',
      '.card-wrapper'
    ];
    for (const sel of shopifySelectors) {
      if (document.querySelectorAll(sel).length >= 2) {
        return { isCMS: true, platform: 'shopify', cardSelector: sel };
      }
    }
  }

  // 2. WooCommerce
  const isWoo = document.body?.classList.contains('woocommerce') ||
    !!document.querySelector('link[href*="woocommerce"], style#woocommerce-layout-inline-css');
  if (isWoo) {
    const wooSelectors = ['.products .product', '.wc-block-grid__product', 'li.product'];
    for (const sel of wooSelectors) {
      if (document.querySelectorAll(sel).length >= 1) {
        return { isCMS: true, platform: 'woocommerce', cardSelector: sel };
      }
    }
  }

  // 3. Magento
  const isMagento = !!document.querySelector('script[src*="mage/"], .catalog-category-view, [data-product-id]');
  if (isMagento) {
    const magentoSelectors = ['.product-item', '.product-item-info', 'li.item.product'];
    for (const sel of magentoSelectors) {
      if (document.querySelectorAll(sel).length >= 1) {
        return { isCMS: true, platform: 'magento', cardSelector: sel };
      }
    }
  }

  // 4. BigCommerce
  const isBigCommerce = !!document.querySelector('link[href*="bigcommerce"], script[src*="bigcommerce"]');
  if (isBigCommerce) {
    return { isCMS: true, platform: 'bigcommerce', cardSelector: '.card, [data-product-slide], .productGrid .product' };
  }

  // 5. Squarespace Commerce
  const isSquarespace = !!document.querySelector('body[class*="squarespace"], .sqs-block-product');
  if (isSquarespace) {
    return { isCMS: true, platform: 'squarespace', cardSelector: '.ProductList-item, .grid-item' };
  }

  return { isCMS: false, platform: 'generic', cardSelector: '' };
}

export function extractCMSProducts(platform: PlatformType, selector: string): ProductNode[] {
  const nodes: ProductNode[] = [];
  const cards = document.querySelectorAll<HTMLElement>(selector);

  cards.forEach((card, idx) => {
    // Title
    const titleEl = card.querySelector<HTMLElement>(
      'h2, h3, h4, .product-title, .title, .card__heading, a[href*="/products/"]'
    );
    const title = titleEl?.textContent?.trim() || '';
    if (!title || title.length < 3) return;

    // Price
    const priceEl = card.querySelector<HTMLElement>('.price, .money, .price__regular, .amount');
    const priceText = priceEl?.textContent?.trim();

    // Image
    const imgEl = card.querySelector<HTMLImageElement>('img');
    const imageUrl = imgEl?.src;

    // Brand
    const brandEl = card.querySelector<HTMLElement>('.vendor, .caption-with-letter-spacing, .brand');
    let brand = brandEl?.textContent?.trim() || '';
    if (!brand) {
      brand = title.split(' ')[0] || '';
    }

    nodes.push({
      element: card,
      id: `${platform}-${idx}`,
      platform,
      title,
      brand,
      priceText,
      imageUrl,
      isSponsored: false,
      badges: [],
      rawText: card.innerText || ''
    });
  });

  return nodes;
}
