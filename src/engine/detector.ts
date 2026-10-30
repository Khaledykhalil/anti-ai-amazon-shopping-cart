import { ProductNode } from './types';
import { isAmazon, extractAmazonProducts } from './adapters/amazon';
import { isEbay, extractEbayProducts } from './adapters/ebay';
import { getActiveBigBoxConfig, extractBigBoxProducts } from './adapters/bigbox';
import { detectCMSEngine, extractCMSProducts } from './adapters/cms';
import { extractUniversalProducts } from './adapters/universal';

/**
 * Executes the 3-Tier Adapter Pipeline across the active webpage
 */
export function detectAllProducts(): ProductNode[] {
  // Tier 1: Dedicated Marketplace Adapters
  if (isAmazon()) {
    return extractAmazonProducts();
  }

  if (isEbay()) {
    return extractEbayProducts();
  }

  const bigBoxConfig = getActiveBigBoxConfig();
  if (bigBoxConfig) {
    const items = extractBigBoxProducts(bigBoxConfig);
    if (items.length > 0) return items;
  }

  // Tier 2: Standalone Storefront Fingerprinting (Shopify, WooCommerce, etc.)
  const cms = detectCMSEngine();
  if (cms.isCMS) {
    const items = extractCMSProducts(cms.platform, cms.cardSelector);
    if (items.length > 0) return items;
  }

  // Tier 3: Universal Semantic & Structural Fallback
  return extractUniversalProducts();
}
