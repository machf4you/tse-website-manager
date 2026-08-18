# RESTORE POINT: v1.30-magento-classification-rules

**Date:** 18 August 2026  
**Version:** V1.30 (Maintain V1.30 Release)  
**Status:** STABLE baseline for HF4You Magento Category and CMS Page Classification Rules.

---

## 1. Objectives Accomplished
- **Authoritative Magento Classification Engine**:
  - Implemented Magento category hierarchy & CMS page classification rules inside `src/utils/packageExtractor.js` (`classifyPageType` & `normalizeImportedPage`) and `server/index.js` (`POST /api/websites/:id/magento-sync`).
  - **Homepage**: `Hub` / Priority 1 (`cms-home`, root URL).
  - **Active Categories (`level >= 2`, `is_active !== false`)**: `Landing` / Priority 2 (`Beds`, `Mattresses`, `Ottoman Beds`, `Memory Foam Beds`).
  - **Container Categories (`level <= 1` or `is_active === false`)**: `Excluded` / Priority 0 (`Root Catalog`, `Hf4you`, inactive categories).
  - **Non-Excluded CMS Pages**: `Topical` / Priority 3 (`Types of Mattresses Explained`, `Best Mattress for Back Pain UK`).
  - **Policy / Utility Pages**: `Excluded` / Priority 0 (`Privacy Policy`, `Terms & Conditions`, `Contact Us`, `404`).

---

## 2. Modified Files
- `src/utils/packageExtractor.js`: Extended `classifyPageType` and `normalizeImportedPage` for Magento category hierarchy nodes.
- `server/index.js`: Updated `magento-sync` endpoint to compute platform-aware classifications upon sync.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
