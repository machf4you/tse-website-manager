# RESTORE POINT: v1.30-server-state-rehydration

**Date:** 18 August 2026  
**Version:** V1.30 (Maintain V1.30 Release)  
**Status:** STABLE baseline for authoritative server-state re-hydration after connection updates.

---

## 1. Objectives Accomplished
- **Authoritative Server-State Re-Hydration**:
  - Updated `handleUpdateWebsite` in `WebsitesDashboard.jsx` to immediately re-fetch the fresh website list directly from `getWebsitesApi()` (SQLite database) after ANY connection update.
  - Matches the updated site by ID against the fresh server records and updates `managedSite` in React state and `localStorage` (`tse_managed_site_object_v1`) using the authoritative server record (`platform: "magento"`).
  - Guarantees inline connection updates for WordPress, Magento, or Other websites never degrade or lose permanent platform classifications.

---

## 2. Modified Files
- `src/pages/WebsitesDashboard.jsx`: Implemented `async handleUpdateWebsite` with automatic `getWebsitesApi()` re-hydration.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
