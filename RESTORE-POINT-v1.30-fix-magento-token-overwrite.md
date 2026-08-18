# RESTORE POINT: v1.30-fix-magento-token-overwrite

**Date:** 18 August 2026  
**Version:** V1.30 (Maintain V1.30 Release)  
**Status:** STABLE baseline for Magento Admin Bearer Token persistence without raw password overwrite.

---

## 1. Objectives Accomplished
- **Magento Token Overwrite Fix**:
  - Updated `server/index.js` `POST /api/websites/:id/magento-token` route to include `token: tokenStr` in the JSON response payload.
  - Updated `authorizeMagentoAdminTokenApi` in `src/services/exporterApi.js` to pass `token: data.token` to the caller.
  - Updated `handleConnect` in `AddWebsiteDialog.jsx` so `magentoTile` uses `authRes.token` (the fresh Bearer token) for `wpPass` and `configData.wpPass` rather than overwriting `wpPass` with `mgPass.trim()` (the raw password).
  - Guarantees `configData.wpPass` in SQLite database permanently retains the valid Magento Bearer Token string (`eyJraWQi...`).

---

## 2. Modified Files
- `server/index.js`: Returned `token: tokenStr` in `magento-token` endpoint response.
- `src/services/exporterApi.js`: Passed `token` property in `authorizeMagentoAdminTokenApi` return object.
- `src/components/AddWebsiteDialog.jsx`: Set `wpPass` and `configData.wpPass` in `magentoTile` to the fresh `authRes.token` string.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
