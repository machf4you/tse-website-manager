# RESTORE POINT: Confirmed Stable Global Phrase-Matching Engine & Safe String Navigation (V2.00)

- **Restore Point Identifier**: `V2.00-STABLE-GLOBAL-PHRASE-MATCHING-CONFIRMED`
- **Git Tag**: `v2.00-stable-global-phrase-matching-confirmed`
- **Build Version**: `V2.00 | READY` (Build Hash: `w3minwindow200`)
- **Date**: 03-09-2026 11:15
- **Author**: Antigravity Assistant (Confirmed & Accepted Personally by Mac on Live Production)

---

## 1. Verified & Confirmed Live State

This restore point represents the confirmed-good production release V2.00 following live acceptance testing on `https://tse-website-manager.thesearchequation.co.uk/`.

### Key Verified Capabilities:
1. **Live Verified Single-Page Audit (HF4You 4ft 6 Double Beds)**:
   - **Target Phrase**: `4ft 6 Double Beds`
   - **Meta Title**: `PASS` (100) — `"Cheap Double Beds (4ft 6) for Sale"`
   - **Meta Description**: `PASS` (100) — `"Shop cheap double beds in 4ft 6 size. Double beds available with fast UK delivery..."`
   - **H1**: `PASS` (90) — `"Cheap Double Beds (4ft 6) for Sale"`
2. **Deterministic Minimum-Window Intent Matching**:
   - Computes the minimum contiguous token sliding window containing at least one occurrence of every target token.
   - Eliminates false distance penalties when words (e.g. "beds", "double") repeat in later sentences.
   - Supports natural word-order permutations without requiring rigid string contiguity.
3. **Preserved Commercial Modifiers**:
   - Substantive search terms (such as `Cheap`, `Sale`, `Luxury`, `UK`, `Best`) configured in target phrases are preserved as mandatory matching components, while only non-substantive grammatical fillers are ignored.
4. **Universal Normalization**:
   - Dimension canonicalisation (`4ft 6"`, `4'6"`, `4ft 6in` $\rightarrow$ `4ft 6`).
   - S-stemming plurals and verb inflections (`beds` $\rightarrow$ `bed`, `extensions` $\rightarrow$ `extens`, `conversions` $\rightarrow$ `convers`).
   - Ampersand normalization (`&` $\rightarrow$ `and`).
   - Case-insensitive, punctuation/hyphen/bracket stripping.
5. **Universal Safe-String Handling**:
   - Coerces WordPress REST AST title objects (`{ rendered: "...", raw: "..." }`) to clean primitive strings across all pages, sorts, hierarchy builders, recommendation engines, and dialogs (`safeString.js`).
   - Verified seamless navigation across WordPress (Ascent Builders, Bathroom Upgrades, Civion) and Magento (HF4You) across W2, W3, and W4.
6. **Preserved HF4You Category Hierarchy (V1.96)**:
   - `Beds` (cat-11) $\rightarrow$ `Shop By Bed Size` (cat-810) $\rightarrow$ 7 Bed size pages.
   - `Beds` $\rightarrow$ `Shop By Bed Type` (cat-1247).
   - `Bed Frames` (cat-1210) $\rightarrow$ `Shop By Bed Frame Size` (cat-1260) & `Shop By Bed Frame Type` (cat-1245).
   - `Divan Beds` (cat-51) $\rightarrow$ `Shop by Divan Size` (cat-1251) & `Shop by Divan Type` (cat-1248).
7. **100% Data & Configuration Integrity**:
   - Zero modifications to stored SQLite configurations, target phrases, custom titles, manual priorities, or ⭐ work flags.
   - Zero modifications to live Magento or WordPress store content.

---

## 2. Core Modified & Verified Components

| File | Subsystem | Description |
| :--- | :--- | :--- |
| [`src/utils/phraseMatcher.js`](file:///c:/Antigravity/tse-website-manager/src/utils/phraseMatcher.js) | Frontend Client | Pure JS deterministic phrase matcher with `findMinTokenWindow()`. |
| [`src/utils/safeString.js`](file:///c:/Antigravity/tse-website-manager/src/utils/safeString.js) | Shared Utility | Authoritative `extractSafeString()`, `safeLower()`, `safeTrim()` helpers. |
| [`src/utils/packageExtractor.js`](file:///c:/Antigravity/tse-website-manager/src/utils/packageExtractor.js) | Package Normalizer | Ensures all extracted page `title` and `originalTitle` values are primitive strings. |
| [`src/utils/targetPhraseGenerator.js`](file:///c:/Antigravity/tse-website-manager/src/utils/targetPhraseGenerator.js) | Target Generator | Safe string handling in utility filter and topic generator. |
| [`src/utils/seoRecommendationGenerator.js`](file:///c:/Antigravity/tse-website-manager/src/utils/seoRecommendationGenerator.js) | W4 SEO Engine | Uses `matchTargetPhraseIntent()` for intent-aware SEO checks. |
| [`src/pages/PageManagementPage.jsx`](file:///c:/Antigravity/tse-website-manager/src/pages/PageManagementPage.jsx) | W3 Management | Protected sorting, hierarchy grouping, and page list mapping. |
| [`src/pages/ManageWebsitePage.jsx`](file:///c:/Antigravity/tse-website-manager/src/pages/ManageWebsitePage.jsx) | W2 Overview | Protected page mapping and separator filtering. |
| [`src/pages/PageAuditResultsPage.jsx`](file:///c:/Antigravity/tse-website-manager/src/pages/PageAuditResultsPage.jsx) | W4 Audit Results | Protected header extraction and intent-aware table breakdown checks. |
| `/opt/tse-apps/page-auditor/backend/audit/scorer.py` | Page Auditor API | Authoritative backend scorer with `_find_min_token_window()`. |

---

## 3. Deployment Artifacts

- **Frontend Bundle**: `dist/assets/index-13dKkL7s.js`
- **PM2 Services**: `website-manager-api` (Port 3005) and `page-auditor-api` (Port 8005) online.
- **Git Tag**: `v2.00-stable-global-phrase-matching-confirmed`
