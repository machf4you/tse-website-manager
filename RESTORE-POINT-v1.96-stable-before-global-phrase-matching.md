# Restore Point: V1.96-STABLE-BEFORE-GLOBAL-PHRASE-MATCHING

**Date**: 03 September 2026 09:52  
**Version**: `V1.96` (`V1.96 | READY`)  
**Git Tag**: `v1.96-stable-before-global-phrase-matching`  
**Base Commit**: `a34ca1b`  
**Status**: `Authoritative Pre-Change Restore Point`

---

## 1. Purpose & Protection Scope

This restore point captures the exact confirmed-good production baseline of Website Manager and the Page Auditor engine prior to implementing the global deterministic target-phrase matching algorithm (PASS / IMPROVE / FAIL) across Meta Title, Meta Description, and H1.

### Protected State:
1. **Category Hierarchy**: Confirmed V1.96 W3 category tree structure for HF4You (`BEDS` with `Shop By Bed Size` [7 size pages] and `Shop By Bed Type`, `DIVAN BEDS`, `BED FRAMES` [isolated with 0 Beds size pages]).
2. **Configuration Integrity**: All 112 stored page configurations, target phrases, custom titles, manual priorities, and ⭐ flags in SQLite.
3. **Canonical URLs & Exclusions**: 122 genuine SEO-managed pages with clean 2-level canonical URLs.
4. **Backend API Services**: Functional PM2 services on VPS (`website-manager-api` on port 3005 and `page-auditor-api` on port 8000).
