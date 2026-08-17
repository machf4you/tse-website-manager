# RESTORE POINT: v1.18-yoast-rest-metadata-extraction-fix

**Date:** 17 August 2026  
**Version:** v1.18 (V10.9 Build)  
**Status:** STABLE baseline for Yoast REST metadata (`yoast_head_json.title` & `yoast_head_json.description`) extraction upon Sync Data.

---

## 1. Objectives Accomplished
- **Yoast REST Metadata Extraction Fix**:
  - Updated `packageExtractor.js` (`normalizeImportedPage` and `extractPagesFromPackage`) to explicitly extract `yoast_head_json.title` and `yoast_head_json.description` into `metaTitle` and `metaDescription` prior to stripping heavy REST AST objects.
  - Fixes the bug where live Yoast meta titles/descriptions saved on WordPress were stripped during package normalization, causing Sync Data to fall back to plain un-edited WordPress page titles.
- **Version Bump**:
  - Bumped version manifest to `10.9` (`CURRENT_BUILD_VERSION = '10.9'`).

---

## 2. Modified Files
- `src/utils/packageExtractor.js`: Preserved `yoast_head_json.title` and `yoast_head_json.description` in normalized page objects.
- `src/config/version.js`: Bumped version to 10.9.
- `public/version.json`: Bumped version payload to 10.9.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
