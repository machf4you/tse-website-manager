# RESTORE POINT: v1.28-w2-platform-aware-sync-button

**Date:** 17 August 2026  
**Version:** v1.28 (V1.28 Build)  
**Status:** STABLE baseline for W2 Website Dashboard platform-aware sync controls and removal of audit buttons.

---

## 1. Objectives Accomplished
- **W2 Platform-Aware Sync Controls**:
  - Refactored W2 header actions to display a single, platform-aware primary sync button:
    - WordPress sites: `Sync from WordPress`
    - Magento sites (e.g. HF4You): `Sync from Magento`
    - Other sites: `Sync from Other`
  - Clicking `Sync from Magento` triggers the Magento API synchronisation flow using the backend proxy and Magento authentication token system.
- **Removed Audit Controls from W2**:
  - Removed `Latest Audit Results` and `Run Audit` buttons from W2 (auditing is managed per-page from W3/W4).
- **Application Version Bump**:
  - Set version manifest to **V1.28** (`CURRENT_BUILD_VERSION = '1.28'`, `CURRENT_BUILD_LABEL = 'V1.28 LIVE'`).

---

## 2. Modified Files
- `src/pages/ManageWebsitePage.jsx`: Added platform-aware button label logic (`Sync from ${platformName}`) and removed W2 audit buttons.
- `src/config/version.js`: Set version to 1.28.
- `public/version.json`: Set version payload to 1.28.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
