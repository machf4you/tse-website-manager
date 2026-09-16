# RESTORE POINT: v1.30-fix-platform-state-persistence

**Date:** 17 August 2026  
**Version:** V1.30 (Maintain V1.30 Release)  
**Status:** STABLE baseline for permanent website platform property state persistence (`platform: "magento"`).

---

## 1. Objectives Accomplished
- **Platform State Persistence Fix**:
  - Refactored `AddWebsiteDialog.jsx` `useEffect` to reliably detect Magento platform from `platform` field or `configData.mgBackendUrl`.
  - Updated `handleSaveDraft` and `handleConnect` in `AddWebsiteDialog.jsx` to explicitly preserve `platform: "magento"` at both root level and inside `configData`.
  - Updated `handleUpdateWebsite` in `WebsitesDashboard.jsx` to preserve `platform: "magento"` across state updates and `localStorage` caching (`tse_managed_site_object_v1`).
  - Ensures W2 permanently displays **`Sync from Magento`** for HF4You without falling back to WordPress.

---

## 2. Modified Files
- `src/components/AddWebsiteDialog.jsx`: Updated `useEffect` platform resolution and preserved `platform` in `handleSaveDraft`.
- `src/pages/WebsitesDashboard.jsx`: Updated `handleUpdateWebsite` to guarantee `platform: "magento"` persistence on active managed site object.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
