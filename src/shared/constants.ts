import { UserSettings, InspectionStats } from './types';

export const DEFAULT_SETTINGS: UserSettings = {
  enabled: true,
  mode: 'blur', // 'blur' shields with warning badge & swap button; 'hide' hides listing; 'replace-real' swaps with customer photos
  sensitivity: 'medium',
  filterClothingModels: true,
  filterFoodImagery: true,
  filterMarketingSlop: true,
  prioritizeCustomerPhotos: true,
  highlightRealPhotos: true,
  whitelistedBrands: []
};

export const DEFAULT_STATS: InspectionStats = {
  listingsScanned: 0,
  aiImagesFiltered: 0,
  realPhotosSwapped: 0,
  lastUpdated: Date.now()
};

export const AMAZON_SELECTORS = {
  // Search result items
  searchResultCard: [
    'div[data-component-type="s-search-result"]',
    '.s-result-item[data-asin]:not([data-asin=""])',
    'li.s-result-item'
  ].join(','),

  // Search result image container & img
  searchResultImageContainer: '.s-product-image-container, .rush-component .a-section',
  searchResultImage: 'img.s-image, [data-component-type="s-product-image"] img',
  searchResultTitle: 'h2 a, h2 span, .a-size-medium.a-color-base.a-text-normal, .a-size-base-plus',
  searchResultBrand: '.a-size-mini.a-color-secondary, .s-line-clamp-1 .a-size-base-plus',

  // Product detail page
  detailMainImage: '#landingImage, #imgTagWrapperId img, #main-image-container img',
  detailImageThumbnails: '#altImages li.item img, #imageBlock_feature_div img',
  detailFeatureBullets: '#feature-bullets ul li, #productFactsDesktopExpander ul li',
  detailProductDescription: '#productDescription p, #aplus',
  detailBrandLink: '#bylineInfo, #brandSnapshot_feature_div a',

  // Real Customer Review Photos
  customerReviewPhotosContainer: '#review-image-thumbs, .review-image-tile-section, [data-hook="review-image-tile"]',
  customerReviewImages: 'img[alt*="Customer image"], img.review-image-tile, [data-hook="review-image-tile"] img',

  // Shopping Cart
  cartListItem: '.sc-list-item, div[data-asin].sc-list-item-content',
  cartProductImage: '.sc-product-image, img.sc-product-image',
  cartProductTitle: '.sc-product-title, .a-list-item a.a-link-normal .a-truncate-full'
};

// AI Marketing Clichés and LLM filler phrases commonly found on Amazon listings
export const AI_TEXT_BUZZWORDS = [
  'a testament to',
  'delve into',
  'seamlessly blend',
  'seamless blend',
  'elevate your style',
  'elevate your everyday',
  'elevate your experience',
  'unparalleled quality',
  'unparalleled comfort',
  'meticulously crafted',
  'crafted with precision',
  'crafted to perfection',
  'embodies the essence',
  'game changer',
  'revolutionary design',
  'cutting-edge technology',
  'designed for the modern',
  'perfect harmony',
  'curated for',
  'transcend ordinary',
  'whether you are looking to',
  'look no further than',
  'a touch of elegance',
  'sophistication meets',
  'in conclusion',
  'rich tapestry'
];

// Indicators in URLs, filenames, or alt tags that suggest synthetic / 3D / AI creation
export const AI_IMAGE_INDICATORS = [
  'virtual-model',
  'synthetic',
  'ai-model',
  'ai_generated',
  'midjourney',
  'dall-e',
  'flux-dev',
  'flux-schnell',
  'stable-diffusion',
  'generative-fill',
  'photoshop-ai',
  'c4d-render',
  'octane-render',
  '3d-render',
  'mockup-clothing'
];

export const SENSITIVITY_THRESHOLDS = {
  low: 0.75,    // Only flag when high certainty
  medium: 0.50, // Balanced default
  high: 0.35    // Aggressive filtering
};
