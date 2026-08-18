# RESTORE POINT: v1.30-add-three-exclusions

**Date:** 18 August 2026  
**Version:** V1.30 (Maintain V1.30 Release)  
**Status:** STABLE baseline for HF4You Additional Named Exclusion Rules (Customer Service, Enable Cookies, Further Resources).

---

## 1. Objectives Accomplished
- **Added 3 Named HF4You Page Exclusions**:
  - Extended `exclusionPatterns` in `src/utils/packageExtractor.js` and `server/index.js` to automatically exclude:
    1. Customer Service (`cms-100`)
    2. Enable Cookies (`cms-101`)
    3. Further Resources (`cms-112`)
  - Set `Page Type = Excluded`, `Priority = 0`, and cleared target phrases.
  - Preserved all genuine commercial Landing pages, Topical buying guides, and Homepage Hub.

---

## 2. Modified Files
- `src/utils/packageExtractor.js`: Added Customer Service, Enable Cookies, Further Resources exclusion patterns.
- `server/index.js`: Updated `magento-sync` endpoint with new exclusion patterns.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- SQLite Database package: 28 Excluded pages, 1 Hub, 60 Landing, 54 Topical, 0 Unclassified.
- Git push to GitHub `main` (`main -> main`).
