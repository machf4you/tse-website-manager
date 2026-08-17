# RESTORE POINT: v1.30-server-state-hydration-fix

**Date:** 17 August 2026  
**Version:** V1.30 (Maintain V1.30 Release)  
**Status:** STABLE baseline for authoritative server-state website hydration in WebsitesDashboard.jsx.

---

## 1. Objectives Accomplished
- **Authoritative Server State Hydration**:
  - Refactored `WebsitesDashboard.jsx` `useEffect` to match active `managedSite` against fresh `apiSites` records returned from `getWebsitesApi()` on mount.
  - Automatically updates `managedSite` in React state with the fresh database record (`platform: "magento"`), overriding any stale `localStorage` snapshot.
  - Synchronizes `localStorage.setItem('tse_managed_site_object_v1', JSON.stringify(freshSite))` so stale snapshots cannot persist across page refreshes.
  - Ensures W2 permanently displays **`Sync from Magento`** for HF4You and all Magento websites.

---

## 2. Modified Files
- `src/pages/WebsitesDashboard.jsx`: Added server-state hydration logic to match `managedSite` against `apiSites` on mount.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
