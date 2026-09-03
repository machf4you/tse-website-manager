# Restore Point: V1.96-STABLE-HF-CATEGORY-HIERARCHY-CONFIRMED

**Date**: 03 September 2026 09:00  
**Version**: `V1.96` (`V1.96 | READY`)  
**Git Tag**: `v1.96-stable-hf-category-hierarchy-confirmed`  
**Base Fix Commit**: `7fdbfa7`  
**Status**: `Authoritative Stable Production Restore Point`

---

## 1. Scope & System State Protected

This restore point establishes the confirmed-good baseline following the complete diagnosis, fix, and live visual acceptance of the **HF4You Magento Category Hierarchy** in W3 Manage Pages.

### Confirmed System Architecture & Protections:
1. **Beds Category Hierarchy**:
   - `BEDS` (`cat-11`) correctly contains both visual separators:
     - `📁 Shop By Bed Size` (`cat-810`) containing all 7 child bed size pages (`2ft 6 Small Single Beds` to `6ft Super King Size Beds`).
     - `📁 Shop By Bed Type` (`cat-1247`) containing all 6 bed type pages (`Bed Bases`, `Guest Beds`, `Memory Foam Beds`, `Orthopaedic Beds`, `Ottoman Beds`, `Zip and Link Beds`).
2. **Bed Frames Category Hierarchy**:
   - `BED FRAMES` (`cat-1210`) strictly contains its own visual separators:
     - `📁 Shop By Bed Frame Size` (`cat-1260`) containing all 5 bed frame size pages (`3ft Single` to `6ft Super King`).
     - `📁 Shop By Bed Frame Type` (`cat-1245`) containing `Ottoman Bed Frames`.
   - **Zero** Bed size pages appear underneath or after the Bed Frames section.
3. **Divan Beds Category Hierarchy**:
   - `DIVAN BEDS` (`cat-51`) hierarchy remains intact with `Shop By Divan Size` (`cat-1251`), `Shop by Divan Type` (`cat-1248`), and direct category children.
4. **Visual Separator Architecture**:
   - All 6 "Shop By..." categories are visual navigation separators only: non-clickable, excluded from target phrase generation, manual priority overrides, audit runs, and SEO page counts.
   - Resilient `isShopBySeparator` detection inspecting `originalTitle`, `name`, `slug`, and category IDs (`810`, `1245`, `1247`, `1248`, `1251`, `1260`), immune to Magento SEO `meta_title` overrides.
5. **SEO Page Inventory & Metrics**:
   - Exact count of **122** active SEO-managed pages ($128 \text{ unique URLs} - 6 \text{ Shop By visual separators} = 122$).
6. **Preserved User Configurations & Targeting**:
   - 100% of the 112 stored page configurations preserved in SQLite and client state:
     - Target phrases
     - Custom/proposed titles
     - Manual priority overrides
     - ⭐ work-priority flags
     - Audit results and timestamps
7. **Clean Canonical URLs**:
   - All 47 active category pages resolve to 2-level canonical URLs (`/{top-category-slug}/{leaf-slug}`).
   - Zero legacy Magento filter paths (`/type/`, `/bed-sizes/`, `/shop-by-divan-type/`) in canonical SEO management.
8. **Multi-Store Isolation**:
   - HF4You store tree filtering (`1/2/` prefix) guarantees 0 cross-store contamination from Cheap Bed Sale (`1/226/`) or Mattress Time (`1/225/`).
