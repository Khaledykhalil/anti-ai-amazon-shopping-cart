# 🤝 Contributing to Blurify

We love community contributions! Blurify is built as an open, collective defense against e-commerce deception, algorithmic monopoly, and consumer exploitation.

---

## 30-Second Contribution: Add a Brand (No Coding Needed!)

You can add a brand to our filter lists directly from your web browser in 30 seconds:

1. Navigate to [`public/lists/`](public/lists/) on GitHub.
2. Select the relevant category:
   - `boycotts.json` — BDS & Corporate Watchlists
   - `environment.json` — Ultra-Fast Fashion & Environmental Hazards
   - `labor.json` — Forced Labor & Sweatshops
   - `cruelty_free.json` — Non-Cruelty-Free & Animal Testing Watchlist
   - `house_brands.json` — Retailer Monopoly Private Labels
   - `brand_whitelist.json` — Legitimate Heritage Acronyms & Exclusions
3. Click the **✏️ Edit (pencil icon)** button in GitHub.
4. Add the entry following this JSON format:
```json
{
  "brand": "ExampleBrand",
  "parent": "Example Conglomerate",
  "aliases": ["Example SubBrand"],
  "reason": "Neutral explanation with factual citation.",
  "citation": "https://credible-source.org/report"
}
```
5. Click **Commit changes...** and submit a Pull Request!

---

## Local Development Workflow

### Prerequisites
- Node.js 20+ or 22+
- npm or pnpm

```bash
# 1. Clone repository
git clone https://github.com/Khaledykhalil/anti-ai-amazon-shopping-cart.git blurify
cd blurify

# 2. Install dependencies
npm install

# 3. Start development server with live reload
npm run dev

# 4. Run tests
npm test

# 5. Typecheck code
npm run compile

# 6. Build production packages
npm run build:chrome
npm run build:firefox
npm run build:safari
```

---

## Rules of the Road
1. **Factual Neutrality:** Every brand added to a boycott, labor, or ethics list MUST have an accompanying verifiable source link.
2. **Zero Remote Execution:** Never submit pull requests that introduce dynamic code execution, third-party CDNs, or external telemetry.
3. **Keep It Fast:** Detection heuristics and DOM observers must maintain 60fps performance on low-end hardware.
