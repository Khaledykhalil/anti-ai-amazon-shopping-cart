import { PlatformType, ProductNode } from '../types';

interface BigBoxConfig {
  name: PlatformType;
  hostRegex: RegExp;
  cardSelector: string;
  titleSelector: string;
  brandSelector?: string;
  priceSelector?: string;
  imageSelector?: string;
  sponsoredSelector?: string;
}

const BIG_BOX_CONFIGS: BigBoxConfig[] = [
  {
    name: 'walmart',
    hostRegex: /walmart\.com/i,
    cardSelector: '[data-item-id], [data-testid="list-view"]',
    titleSelector: '[data-automation-id="product-title"], span[data-testid="product-title"]',
    brandSelector: '.w_hl',
    priceSelector: '[data-automation-id="product-price"]',
    imageSelector: 'img[data-testid="productTileImage"]',
    sponsoredSelector: '[data-automation-id="sponsored-product"]'
  },
  {
    name: 'target',
    hostRegex: /target\.com/i,
    cardSelector: '[data-test="@web/site-top-of-funnel/ProductCardWrapper"], [data-test="product-grid"] > div',
    titleSelector: 'a[data-test="product-title"], [data-test="product-title"]',
    brandSelector: '[data-test="product-brand"]',
    priceSelector: '[data-test="current-price"]',
    imageSelector: 'picture img, img',
    sponsoredSelector: '[data-test="sponsored-text"]'
  },
  {
    name: 'bestbuy',
    hostRegex: /bestbuy\.com/i,
    cardSelector: 'li.sku-item, [data-sku-id]',
    titleSelector: '.sku-title a, h4.sku-header a',
    priceSelector: '.priceView-customer-price span',
    imageSelector: 'img.product-image',
    sponsoredSelector: '.sponsored-badge'
  },
  {
    name: 'etsy',
    hostRegex: /etsy\.com/i,
    cardSelector: 'div.v2-listing-card, li.wt-list-unstyled, [data-palette-listing-id]',
    titleSelector: 'h3.v2-listing-card__title, .v2-listing-card__title',
    brandSelector: '.v2-listing-card__shop',
    priceSelector: '.currency-value',
    imageSelector: 'img.wt-image',
    sponsoredSelector: '.ad-indicator'
  },
  {
    name: 'temu',
    hostRegex: /temu\.com/i,
    cardSelector: 'div[data-tooltip*="goods"], div.goods-container, div[class*="GoodsItem"], div[class*="_goods_wrap_"]',
    titleSelector: 'div[class*="title"], div[class*="goods_title"]',
    priceSelector: 'div[class*="price"], span[class*="price"]',
    imageSelector: 'img'
  },
  {
    name: 'aliexpress',
    hostRegex: /aliexpress\.com/i,
    cardSelector: '.search-item-card-wrapper, div[class*="product-container"], div[class*="list--gallery--"]',
    titleSelector: 'h3, div[class*="title--"]',
    priceSelector: 'div[class*="price--"]',
    imageSelector: 'img'
  },
  {
    name: 'shein',
    hostRegex: /shein\.com/i,
    cardSelector: '.product-list__item, div[class*="product-card"], .S-product-item',
    titleSelector: '.product-intro__name, a[class*="goods-title"]',
    priceSelector: '.product-item__camefrom-price, span[class*="price"]',
    imageSelector: 'img'
  },
  {
    name: 'homedepot',
    hostRegex: /homedepot\.com/i,
    cardSelector: 'div[data-testid="product-pod"], div.browse-search__pod',
    titleSelector: 'span[data-testid="attribute-product-title"], h3',
    brandSelector: 'span[data-testid="attribute-brand-name"]',
    priceSelector: 'div.price-format__large',
    imageSelector: 'img'
  },
  {
    name: 'costco',
    hostRegex: /costco\.com/i,
    cardSelector: '.product-list .product, div[data-testid="ProductTile"]',
    titleSelector: 'span.description a, a[data-testid="Link"]',
    priceSelector: 'div.price',
    imageSelector: 'img'
  },
  {
    name: 'wayfair',
    hostRegex: /wayfair\.com/i,
    cardSelector: 'div[data-hb-id="ProductCard"]',
    titleSelector: 'h2, [data-hb-id="Heading"]',
    brandSelector: '[data-hb-id="Brand"]',
    priceSelector: '[data-hb-id="Price"]',
    imageSelector: 'img'
  }
];

export function getActiveBigBoxConfig(): BigBoxConfig | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  return BIG_BOX_CONFIGS.find((cfg) => cfg.hostRegex.test(host)) || null;
}

export function extractBigBoxProducts(cfg: BigBoxConfig): ProductNode[] {
  const nodes: ProductNode[] = [];
  const cards = document.querySelectorAll<HTMLElement>(cfg.cardSelector);

  cards.forEach((card, idx) => {
    const titleEl = card.querySelector<HTMLElement>(cfg.titleSelector);
    const title = titleEl?.textContent?.trim() || '';
    if (!title) return;

    let brand = '';
    if (cfg.brandSelector) {
      const bEl = card.querySelector<HTMLElement>(cfg.brandSelector);
      brand = bEl?.textContent?.trim() || '';
    }
    if (!brand) {
      brand = title.split(' ')[0] || '';
    }

    const priceEl = cfg.priceSelector ? card.querySelector<HTMLElement>(cfg.priceSelector) : null;
    const priceText = priceEl?.textContent?.trim();

    const imgEl = cfg.imageSelector ? card.querySelector<HTMLImageElement>(cfg.imageSelector) : null;
    const imageUrl = imgEl?.src;

    let isSponsored = false;
    if (cfg.sponsoredSelector) {
      isSponsored = !!card.querySelector(cfg.sponsoredSelector);
    }
    if (!isSponsored) {
      isSponsored = /sponsored|promoted|ad\b/i.test(card.innerText || '');
    }

    const badges: string[] = [];
    if (isSponsored) badges.push('Sponsored');

    nodes.push({
      element: card,
      id: `${cfg.name}-${card.id || idx}`,
      platform: cfg.name,
      title,
      brand,
      priceText,
      imageUrl,
      isSponsored,
      badges,
      rawText: card.innerText || ''
    });
  });

  return nodes;
}
