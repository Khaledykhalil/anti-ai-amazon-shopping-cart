import { defineContentScript } from 'wxt/utils/define-content-script';
import { BlurifyEngine } from '../engine/observer';

export default defineContentScript({
  matches: [
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
  ],
  runAt: 'document_idle',
  main() {
    const engine = new BlurifyEngine();
    engine.start().catch((err) => {
      console.warn('Blurify: Engine failed to start', err);
    });
  }
});
