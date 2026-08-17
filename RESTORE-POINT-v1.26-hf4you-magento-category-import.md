# RESTORE POINT: v1.26-hf4you-magento-category-import

**Date:** 17 August 2026  
**Version:** v1.26 (V1.26 Build)  
**Status:** STABLE baseline for HF4You Magento admin token authentication flow and category tree structure import.

---

## 1. Objectives Accomplished
- **Magento Admin Token Authorization Flow**:
  - Implemented backend proxy endpoint `POST /api/websites/:id/magento-token` executing `POST https://www.hf4you.co.uk/rest/V1/integration/admin/token`.
  - Authenticates Magento Admin username and password, receives the Bearer token, and stores it securely in SQLite without exposing credentials or tokens in git or client logs.
  - Returns clear HTTP 401 authorization error messages if Magento credentials are invalid or expired.
- **Magento Category Tree Import**:
  - Refocused Magento sync specifically on **Magento Category Structure** (excluding individual product pages to prevent importing thousands of unneeded items).
  - Recursively parses the Magento category tree (`GET /rest/all/V1/categories`) into normalized Website Manager pages with `post_type: 'category'`, parent/child relationships, category IDs, and level metadata.
  - Preserves the HF4You homepage (`cms_page` / `home`) with its `Hub` classification.
- **Application Version Bump**:
  - Updated build version manifest to **V1.26** (`CURRENT_BUILD_VERSION = '1.26'`, `CURRENT_BUILD_LABEL = 'V1.26 LIVE'`).

---

## 2. Modified Files
- `server/index.js`: Added `POST /api/websites/:id/magento-token` and refocused `POST /api/websites/:id/magento-sync` on categories structure.
- `src/services/exporterApi.js`: Added `authorizeMagentoAdminTokenApi`.
- `src/components/AddWebsiteDialog.jsx`: Integrated Magento admin token authorization flow during connection setup.
- `src/config/version.js`: Bumped version to 1.26.
- `public/version.json`: Bumped version payload to 1.26.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
