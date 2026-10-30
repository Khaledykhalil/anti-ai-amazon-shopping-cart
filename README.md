# 🛡️ Anti-AI Amazon Shopping Cart

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundled%20with-Vite-646CFF.svg)](https://vitejs.dev/)

**Anti-AI Amazon Shopping Cart** is an open-source browser extension that detects, flags, and hides AI-generated product photography, synthetic fashion models, and marketing slop on Amazon. It prioritizes **real customer review photos** so you can see what clothes, food, and products actually look like before spending your hard-earned money.

---

## 🎯 The Problem

When shopping on Amazon for clothes, furniture, cookware, food, or lifestyle products, the majority of product listings now feature:
- **Uncanny AI-generated models & mannequins** with impossible lighting, poreless plastic skin, and fabric draped via generative fill.
- **Deceptive synthetic lifestyle staging** where items are digitally pasted into 3D renders that hide poor build quality and inaccurate proportions.
- **AI-generated food photography** that looks like hyper-glossy gelatinous renders rather than actual ingredients.
- **LLM-generated bullet points & descriptions** stuffed with clichés (*"a testament to elegance"*, *"seamless fusion"*, *"elevate your everyday"*).

Shoppers buy products expecting what the AI marketing portrayed, only to receive items that look completely different in real life. **Anti-AI Amazon Shopping Cart** restores transparency to online shopping.

---

## ✨ Features

- 🔍 **Multi-Signal AI Detection Engine**:
  - **Frequency & Smoothness Analysis**: Measures micro-contrast and sensor grain signatures to differentiate real camera optics from over-smoothed synthetic diffusion models.
  - **Color & Dynamic Range Probing**: Detects unnatural hyper-saturation and synthetic ambient occlusion.
  - **Marketing Copy & Cliché Classifier**: Detects hallmark LLM buzzwords in titles and bullet points.
  - **Seller Brand Analysis**: Identifies auto-generated consonant soup vendor brands (e.g. `XGTRZ`, `QWJBK`).
  - **Metadata & Attribute Scans**: Inspects image URLs, alt tags, and data attributes for known synthetic render flags.

- 📸 **"Real-Photos-First" Buyer Swap Engine**:
  - Automatically fetches genuine photos submitted by verified buyers from Amazon customer reviews.
  - 1-click swap replaces the fake AI hero image with an authentic customer photo showing how the product actually looks.

- 🎛️ **Customizable Protection Modes**:
  - **🛡️ Blur & Shield (Default)**: Overlays a frosted glass shield with AI confidence scores, detected reasons, and 1-click peek / buyer photo swap.
  - **🚫 Hide Completely**: Collapses AI listings from search results and cart views so you only browse genuine products.
  - **📸 Real Photos Only**: Automatically replaces AI images with real customer photos across the entire page.

- 🏷️ **Integrated Search Control Bar**:
  - Injected directly into Amazon search results. Shows the live count of AI items filtered and lets you switch modes on the fly.

- ⚡ **Category Protections**:
  - 👗 AI Clothing Models & Mannequins
  - 🍔 AI Food & Grocery Photography
  - ✍️ AI Marketing Buzzword Slop

---

## 🚀 Quick Start (Load Unpacked Extension)

### 1. Build the Extension
```bash
# Clone the repository
git clone https://github.com/Khaledykhalil/anti-ai-amazon-shopping-cart.git
cd anti-ai-amazon-shopping-cart

# Install dependencies
npm install

# Build extension
npm run build
```

### 2. Load into Chrome / Brave / Edge
1. Open your browser and navigate to `chrome://extensions/` (or `brave://extensions/` / `edge://extensions/`).
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the `dist/` directory inside this project folder.
5. Go to [Amazon](https://www.amazon.com) and search for any product (e.g., "summer dress" or "kitchen decor"). The shield will activate automatically!

---

## 🛠️ Development

```bash
# Start watch mode during development
npm run dev

# Run TypeScript typechecks
npm run typecheck

# Rebuild extension icons (requires Python 3 and Pillow)
npm run generate-icons
```

---

## 📂 Project Architecture

```
anti-ai-amazon-shopping-cart/
├── public/
│   ├── manifest.json            # Manifest V3 specification
│   └── icons/                   # High-res extension icons (16, 32, 48, 128px)
├── src/
│   ├── background/
│   │   └── service-worker.ts    # Ephemeral service worker & badge manager
│   ├── content/
│   │   ├── index.ts             # Content script entry point & DOM observer
│   │   ├── detector.ts          # Multi-signal AI detection & visual heuristics
│   │   ├── realPhotos.ts        # Verified customer review photo extractor & swapper
│   │   ├── ui.ts                # Injected search banner, shields, & detail cards
│   │   └── styles.css           # Scoped styles for injected overlays
│   ├── popup/
│   │   ├── popup.html           # Modern extension popup UI
│   │   ├── popup.css            # Slate & emerald styling
│   │   └── popup.ts             # User settings & stats controller
│   └── shared/
│       ├── constants.ts         # Selectors, buzzword dictionary, sensitivity scales
│       ├── storage.ts           # Type-safe sync & local storage helpers
│       └── types.ts             # Shared TypeScript definitions
├── scripts/
│   └── generate-icons.py        # Icon generator script
├── package.json
├── tsconfig.json
├── vite.config.ts               # Background & popup bundle config
└── vite.content.config.ts       # Standalone content script IIFE bundle config
```

---

## 🤝 Contributing

Contributions are warmly welcomed! If you encounter new patterns of AI slop, synthetic staging, or new Amazon DOM layouts:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-ai-heuristic`)
3. Commit your changes (`git commit -m 'Add new AI heuristic for food items'`)
4. Push to the branch (`git push origin feature/new-ai-heuristic`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
