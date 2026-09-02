# Restore Point: V1.92-STABLE-MAGENTO-SYNC-AND-PRIORITY

**Date**: 02 September 2026 16:20  
**Version**: `V1.92`  
**Git Tag**: `v1.92-stable`  
**Commit**: `576b3e3`  
**Status**: `Verified Stable Restore Point`

---

## 1. Scope & State Preserved

This restore point captures the working, verified state of TSE Website Manager (V1.92) before implementing the Canonical Category URL Resolver.

### Key Capabilities in this Build:
1. **Automatic Magento Admin Bearer Token Authentication**:
   - Seamless token acquisition via `POST /rest/all/V1/integration/admin/token` using configured credentials.
   - Transparently handles Bearer token renewals for category and CMS synchronization.
2. **Store-Tree Hierarchy Scoping (`path: 1/2/`)**:
   - Enforces strict store hierarchy path isolation to ensure multi-store databases do not bleed categories from foreign websites (such as Cheap Bed Sale or Mattress Time) into HF4You.
3. **Canonical W3 Priority Resolution**:
   - Derives SEO priority directly from `autoType` when `isManualOverride` is `false`, fixing stale priority overrides and ensuring active Landing categories display Priority 2.
4. **Manual Work-Priority Star System (⭐)**:
   - Independent work-priority toggling persisted across sessions in SQLite and localStorage.
5. **W4 Image Alt Text Optimization & Push Pipeline**:
   - Content-image filtering, live Elementor/WordPress HTML push, exact Media ID matching, and green tick persistence.
6. **W4 $\rightarrow$ W3 Navigation & Refresh Stability**:
   - Global React `ErrorBoundary`, null-safe JSON parsing, and active tab localStorage persistence.

---

## 2. Verification Summary

- **HF4You Sync**: 50 categories, 100 CMS pages (128 deduplicated canonical URLs).
- **Divan Beds (`/divans`)**: Correctly classified as `Landing | Priority 2 | ⭐`.
- **Foreign Store URLs**: 100% eliminated from package.
