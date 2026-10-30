## 🛡️ Blurify Pull Request Checklist

### Description
Provide a concise summary of the changes made (new brand rule, heuristic enhancement, adapter fix, or UI refinement).

### Category Impacted
- [ ] 🍉 `bds_boycott` (Geopolitical & Ethical Boycotts)
- [ ] 🤖 `ai_slop` (AI Slop & Prompt Leakage)
- [ ] 📦 `dropship_junk` (Alphabet-Soup Dropshippers)
- [ ] 📢 `sponsored_ads` (Sponsored Placements)
- [ ] 🏢 `house_brands` (Monopoly Private Labels)
- [ ] 👗 `fast_fashion` (Ultra-Fast Fashion & Microplastics)
- [ ] ⛓️ `labor_violations` (Forced Labor & Sweatshops)
- [ ] 🐇 `animal_testing` (Non-Cruelty-Free / Animal Testing)
- [ ] 🧪 `ultra_processed` (NOVA 4 Food Additives)
- [ ] 🔞 `low_trust_nsfw` (Counterfeit & Family Shield)
- [ ] 🛠️ Core Engine / Adapters / Shadow DOM Overlays

### Strict Verification Checklist
- [ ] **Zero Remotely Hosted Code:** No `eval()`, `new Function()`, or dynamic remote script execution has been added.
- [ ] **Source Citations:** Any newly added brand in `public/lists/*.json` includes a valid, publicly accessible citation URL and parent company mapping.
- [ ] **Type Safety & Tests:** Ran `npm run compile` and `npm test` locally with 0 errors.
- [ ] **No Permission Overreach:** No additional permissions requested in `wxt.config.ts` without prior RFC.
