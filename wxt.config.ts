import { defineConfig } from 'wxt';

// Top 25 global shopping domains for default host permissions
export const TOP_SHOPPING_HOSTS = [
  '*://*.amazon.com/*',
  '*://*.amazon.co.uk/*',
  '*://*.amazon.ca/*',
  '*://*.amazon.de/*',
  '*://*.ebay.com/*',
  '*://*.walmart.com/*',
  '*://*.target.com/*',
  '*://*.bestbuy.com/*',
  '*://*.etsy.com/*',
  '*://*.aliexpress.com/*',
  '*://*.temu.com/*',
  '*://*.shein.com/*',
  '*://*.costco.com/*',
  '*://*.homedepot.com/*',
  '*://*.lowes.com/*',
  '*://*.wayfair.com/*',
  '*://*.macys.com/*',
  '*://*.nordstrom.com/*',
  '*://*.instacart.com/*',
  '*://*.newegg.com/*'
];

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Blurify - Universal Ethical & Slop Filter for E-Commerce',
    short_name: 'Blurify',
    description: 'Universal ethical, boycott, dropship, and AI slop filter for Amazon, eBay, Walmart, Shopify, and e-commerce stores.',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: TOP_SHOPPING_HOSTS,
    optional_host_permissions: ['*://*/*'],
    action: {
      default_title: 'Blurify Controls'
    },
    icons: {
      16: 'icon/icon-16.png',
      48: 'icon/icon-48.png',
      128: 'icon/icon-128.png'
    },
    web_accessible_resources: [
      {
        resources: ['lists/*.json', 'icon/*.png'],
        matches: ['<all_urls>']
      }
    ]
  }
});
