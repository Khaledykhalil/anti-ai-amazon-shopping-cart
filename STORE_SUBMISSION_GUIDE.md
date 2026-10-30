# 🚀 Blurify Store Submission & Review Compliance Guide

This guide contains **exact copy-paste text** and compliance instructions for submitting Blurify to the **Chrome Web Store**, **Apple Safari App Store (macOS & iOS)**, and **Mozilla Firefox Add-ons (AMO)**.

---

## 1. Chrome Web Store (CWS) Developer Dashboard

### Single Purpose Description
> Blurify detects and applies customizable optical blur, dimming, or hiding to deceptive AI-generated product photography, white-label dropship brands, ethical boycott targets, ultra-processed food additives, and predatory sponsored search placements across e-commerce marketplaces.

### Detailed Description (Markdown formatted for CWS)
```text
Tired of browsing clothes, food, and products on Amazon, eBay, or Walmart only to be flooded with:
• Uncanny AI-generated models and poreless plastic photography
• 5-to-9 letter alphabet-soup trademark-farm dropshippers (e.g., ZXQWTY)
• Predatory sponsored ad carousels disguised as organic search results
• Monopoly house brands designed to undercut independent merchants
• Ultra-processed foods containing artificial dyes and high-fructose corn syrup

Blurify restores transparency to online shopping. 

100% On-Device Privacy:
Blurify collects ZERO browsing history, ZERO search terms, and ZERO personal data. All filtering algorithms, linguistic entropy scoring, and verified boycott databases execute locally inside your browser.

Key Features:
• 10 Opt-In Filter Categories: BDS/Ethical Boycotts, AI Slop, Dropshippers, Sponsored Ads, House Brands, Fast Fashion, Labor Violations, Animal Testing, NOVA-4 Ultra-Processed Foods, and Low Trust / NSFW.
• Interactive Glassmorphic Overlays: 1-click Peek eye button to reveal items temporarily, or 1-click Whitelist to permanently allow your favorite brands.
• Multi-Platform Support: Seamlessly filters Amazon, eBay, Walmart, Target, Best Buy, Etsy, AliExpress, Temu, Shein, and independent Shopify stores.
• Zero Lag: Built with high-performance IntersectionObserver & MutationObserver for 60fps infinite scrolling.
```

### Permission Justification Statements (Copy & Paste)
When prompted by Google reviewers in the CWS Developer Dashboard under **"Privacy practices"**:

- **`storage` justification:**
  > Used exclusively to save user settings on the local device, including optical blur strength, user-toggled filter categories, and the user's custom brand whitelist/blocklist. Data is never transmitted externally.

- **`activeTab` justification:**
  > Used to inspect product card nodes on the currently focused shopping page when the user opens the extension popup to view tab-specific slop statistics and filter counts.

- **`scripting` justification:**
  > Used to inject content scripts into independent e-commerce storefronts (Shopify, WooCommerce) only when the user explicitly grants optional host permissions via the "Enable Universal Standalone Store Mode" toggle.

- **`host_permissions` justification:**
  > Blurify requires host access to the top 20 global e-commerce domains (such as amazon.com, walmart.com, ebay.com, target.com) to identify product cards in search results, inspect brand names, and apply optical blur filters directly on shopping listings.

- **Data Usage Declaration:**
  - Does the extension collect user data? **No.**
  - Select: **"This extension does not collect or transmit any user data."**

---

## 2. Apple Safari App Store Connect (macOS & iOS)

### Step 1: Converting to Xcode Project
Run the official Apple converter command:
```bash
xcrun safari-web-extension-converter .output/safari-mv2 \
  --project-name "Blurify" \
  --bundle-identifier "com.khaledkhalil.blurify" \
  --app-name "Blurify" \
  --macos-only # or omit for multi-platform iOS + macOS
```

### Step 2: App Review Notes (Copy & Paste)
> **Dear Apple Review Team:**
> Blurify is an open-source, non-commercial privacy and ethical filtering tool for Safari shoppers. 
> 
> To test the extension:
> 1. Launch the app container and enable "Blurify" in Safari Settings -> Extensions.
> 2. Navigate to https://www.amazon.com/s?k=summer+dress or https://www.walmart.com.
> 3. Notice that sponsored ads and alphabet-soup trademark-farm dropshipper brands are frosted with an optical blur shield.
> 4. Click the "👁️ Peek" button on any blurred card to unblur the item.
> 5. Click the Blurify toolbar button to toggle individual filter categories (BDS Boycotts, AI Slop, Ultra-Processed Foods).
> 
> Privacy Guarantee: Blurify does not collect any user data, network logs, or purchase info. All evaluations occur on-device.

### Step 3: App Store Privacy Nutrition Label
- Data Used to Track You: **None**
- Data Linked to You: **None**
- Data Not Linked to You: **None**

---

## 3. Mozilla Firefox Add-ons (AMO)

1. Run `npm run zip:firefox` to generate:
   - `.output/blurify-1.0.0-firefox.zip` (extension package)
   - `.output/blurify-1.0.0-sources.zip` (unminified source code required by Mozilla reviewers)
2. Upload `.output/blurify-1.0.0-firefox.zip` to the AMO Developer Hub.
3. In the source code disclosure prompt:
   - Check **"Yes, this add-on uses code that is processed or minified"**.
   - Upload `.output/blurify-1.0.0-sources.zip`.
   - Instructions for Reviewers: `Run npm install, then npm run build:firefox to reproduce the identical output.`
