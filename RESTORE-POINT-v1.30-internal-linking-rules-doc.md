# RESTORE POINT: v1.30-internal-linking-rules-doc

**Date:** 18 August 2026  
**Version:** V1.30 (Maintain V1.30 Release)  
**Status:** STABLE baseline for Global Settings Internal Linking Rules Reference Documentation Page.

---

## 1. Objectives Accomplished
- **Added Global Settings $\rightarrow$ Internal Linking Rules Section**:
  - Created [`src/pages/InternalLinkingRulesPage.jsx`](file:///c:/Antigravity/tse-website-manager/src/pages/InternalLinkingRulesPage.jsx) and [`src/pages/InternalLinkingRulesPage.css`](file:///c:/Antigravity/tse-website-manager/src/pages/InternalLinkingRulesPage.css).
  - Registered `Internal Linking Rules` in `SETTINGS_MENU` of [`src/pages/GlobalSettings.jsx`](file:///c:/Antigravity/tse-website-manager/src/pages/GlobalSettings.jsx).
  - Documented 14 comprehensive sections detailing:
    1. Incoming link requirement (minimum 3 incoming links).
    2. Recommendation limits (up to 5 candidate source pages per target URL; up to 3 target pages per source page).
    3. Page hierarchy & directional flow (Article/Topical $\rightarrow$ Landing/Hub; Landing $\rightarrow$ Hub/Related Landing; Hub $\rightarrow$ Landing/Topical).
    4. Hub, Landing, Topical, Article page linking rules.
    5. Excluded & Unclassified 0-requirement rules.
    6. Contextual body content linking standards (excluding header, nav, footer, sidebar).
    7. Relevance candidate scoring (token match, title/URL overlap, priority).
    8. Core linking principles (*"Three incoming links is the minimum health threshold..."*).
    9. Platform independence & common Website Manager SEO linking framework.
    10. Current rule status (inherited from WordPress implementation).

---

## 2. Modified Files
- `src/pages/GlobalSettings.jsx`: Registered Internal Linking Rules navigation tab.
- `src/pages/InternalLinkingRulesPage.jsx`: New reference documentation component.
- `src/pages/InternalLinkingRulesPage.css`: New reference documentation styling.
- `RESTORE-POINT-INDEX.md`: Updated active restore point index.
- `src/data/restorePointData.js`: Updated restore point master array.
- `RESTORE-POINT-v1.30-internal-linking-rules-doc.md`: Documented internal linking rules update.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Total restore points listed: 46.
- Latest restore point: `v1.30-internal-linking-rules-doc` (Status: Current).
- Git push to GitHub `main` (`main -> main`).
