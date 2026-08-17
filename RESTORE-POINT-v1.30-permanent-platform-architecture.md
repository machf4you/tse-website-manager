# RESTORE POINT: v1.30-permanent-platform-architecture

**Date:** 17 August 2026  
**Version:** V1.30 (Maintain V1.30 Release)  
**Status:** STABLE baseline for permanent website platform classification architecture.

---

## 1. Objectives Accomplished
- **Permanent Platform Architecture**:
  - Made `platform` an authoritative, immutable classification property of each website record (`WordPress`, `Magento`, `Other`).
  - Added a read-only **Platform Classification** badge in `AddWebsiteDialog.jsx` when editing an existing site, preventing connection updates from changing or defaulting a website's platform.
  - Ensured `AddWebsiteDialog.jsx` and `WebsitesDashboard.jsx` preserve `platform: "magento"` across all connection updates and `localStorage` caching.
  - Confirmed HF4You remains permanently stored as `platform: "magento"`, ensuring W2 permanently renders **`Sync from Magento`**.

---

## 2. Modified Files
- `src/components/AddWebsiteDialog.jsx`: Displayed permanent read-only Platform Classification badge on edit mode.
- `src/pages/WebsitesDashboard.jsx`: Guaranteed `platform: "magento"` persistence across all update paths.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
