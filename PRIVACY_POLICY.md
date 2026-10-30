# 🔒 Privacy Policy for Blurify

**Effective Date:** October 29, 2026  
**Last Updated:** October 29, 2026

**Blurify** ("Universal Ethical & Slop Filter for E-Commerce") is committed to absolute user privacy. Our software is designed from first principles as a **zero-telemetry, 100% local, on-device utility**.

---

## 1. Summary of Our Privacy Guarantees

- **Zero Tracking:** We do not collect, store, transmit, or sell your browsing history, searches, viewed items, shopping cart contents, or purchase information.
- **Zero Remote Code Execution:** All filter evaluations, entropy scoring algorithms, and static databases execute 100% locally on your machine.
- **Zero Third-Party Servers:** Blurify does not connect to any analytics platform, telemetry collector, logging endpoint, or advertising network.
- **No Account Required:** You do not need to register, sign in, or provide an email address to use Blurify.

---

## 2. Browser Permissions Justification

Blurify requests only the minimum viable permissions required to evaluate e-commerce cards on web pages:

| Permission | Purpose |
| :--- | :--- |
| `storage` | Saves your local settings (e.g. custom whitelisted brands, optical blur intensity, enabled categories). Never synced to external servers. |
| `activeTab` | Grants temporary access to examine DOM elements on shopping pages when you interact with the extension popup. |
| `scripting` | Injects the Blurify shadow DOM overlay and evaluation engine when you enable "Universal Standalone Store Mode". |
| `host_permissions` | Restricted by default to the top 20 global e-commerce domains (Amazon, eBay, Walmart, Target, etc.). |
| `optional_host_permissions` | (`*://*/*`) An opt-in permission only requested if you manually enable "Universal Standalone Store Mode" to filter independent Shopify or WooCommerce stores. |

---

## 3. Data Storage

All user preferences, custom blocklists, custom whitelists, and session counts are stored locally in `browser.storage.local`. This data never leaves your device and is wiped immediately if you uninstall Blurify.

---

## 4. Open-Source Verification

Blurify is licensed under the permissive MIT License. Its complete source code is public and auditable by anyone at:  
[https://github.com/Khaledykhalil/anti-ai-amazon-shopping-cart](https://github.com/Khaledykhalil/anti-ai-amazon-shopping-cart)

---

## 5. Contact & Questions

If you have questions regarding this Privacy Policy or wish to report a privacy concern:
- **GitHub Issues:** [Open an Issue](https://github.com/Khaledykhalil/anti-ai-amazon-shopping-cart/issues)
- **Security Inquiries:** See [SECURITY.md](SECURITY.md)
