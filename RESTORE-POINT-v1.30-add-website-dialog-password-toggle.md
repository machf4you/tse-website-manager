# RESTORE POINT: v1.30-add-website-dialog-password-toggle

**Date:** 17 August 2026  
**Version:** v1.30 (V1.30 Build)  
**Status:** STABLE baseline for Edit Connection password field Show / Hide visibility toggle component.

---

## 1. Objectives Accomplished
- **Show / Hide Password Visibility Toggle**:
  - Implemented `<PasswordField>` helper component in `AddWebsiteDialog.jsx`.
  - Added a responsive `"Show"` / `"Hide"` toggle button beside the API Password / Token field.
  - Allows users to visually verify raw entered Magento Admin credentials before submitting the Authorize form.
- **Application Version Bump**:
  - Set version manifest to **V1.30** (`CURRENT_BUILD_VERSION = '1.30'`, `CURRENT_BUILD_LABEL = 'V1.30 LIVE'`).

---

## 2. Modified Files
- `src/components/AddWebsiteDialog.jsx`: Added `PasswordField` component with Show / Hide visibility toggle button.
- `src/config/version.js`: Set version to 1.30.
- `public/version.json`: Set version payload to 1.30.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
