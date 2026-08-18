# RESTORE POINT: v1.30-hf4you-exclusion-rules

**Date:** 18 August 2026  
**Version:** V1.30 (Maintain V1.30 Release)  
**Status:** STABLE baseline for Extended HF4You Page Exclusion Rules.

---

## 1. Objectives Accomplished
- **Extended HF4You Page Exclusions**:
  - Extended `exclusionPatterns` in `src/utils/packageExtractor.js` and `server/index.js` to automatically classify utility/policy CMS pages as `Excluded` (`Priority = 0`) and remove target phrases.
  - Excluded pages include: Returns Policy, Delivery Information/Details, Payment Information, FAQ/FAQs, Finance, Showroom/Store pages, Price Match, Pay Later With Klarna, Partners, Testimonials, Orders & Returns.
  - Preserved all genuine commercial categories (`Landing`, Priority 2), buying guides (`Topical`, Priority 3), and Homepage (`Hub`, Priority 1).

---

## 2. Modified Files
- `src/utils/packageExtractor.js`: Added extended named exclusion patterns.
- `server/index.js`: Added extended named exclusion patterns to `magento-sync` endpoint.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- SQLite Database package: 25 Excluded pages, 1 Hub, 60 Landing, 57 Topical, 0 Unclassified.
- Git push to GitHub `main` (`main -> main`).
