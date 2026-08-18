# RESTORE POINT: v1.30-fix-magento-token-persistence

**Date:** 18 August 2026  
**Version:** V1.30 (Maintain V1.30 Release)  
**Status:** STABLE baseline for Magento Admin Bearer Token SQLite database persistence fix.

---

## 1. Objectives Accomplished
- **Magento Admin Token Persistence Fix**:
  - Replaced broken SQL query in `server/index.js` (`POST /api/websites/:id/magento-token`) referencing obsolete `wp_user` / `wp_pass` top-level columns with clean `UPDATE websites SET config_data = ?, updated_at = ? WHERE id = ?`.
  - Ensures newly generated Bearer tokens from Magento (`POST /rest/V1/integration/admin/token`) are saved securely into SQLite `config_data.wpPass` without database crashes.
  - Maintains `configData` integrity and preserves all existing site settings.

---

## 2. Modified Files
- `server/index.js`: Corrected SQL UPDATE query in `magento-token` route handler.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
