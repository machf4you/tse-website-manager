# RESTORE POINT: v1.25-w1-alphabetical-website-sorting

**Date:** 17 August 2026  
**Version:** v1.25 (V1.25 Build)  
**Status:** STABLE baseline for W1 Connected Websites alphabetical sorting (A → Z) by Website Name.

---

## 1. Objectives Accomplished
- **W1 Alphabetical Website Sorting**:
  - Updated `WebsitesDashboard.jsx` to automatically sort all website tiles alphabetically (A → Z) by their Website Name field using `localeCompare` with natural alphanumeric collation.
  - Sorting applies dynamically whenever the website list renders or updates, regardless of which Server Type filter (`All`, `Nginx`, `LiteSpeed`, etc.) is active.
  - Preserves all tile designs, fields, buttons, and underlying storage persistence.
- **Application Version Bump**:
  - Set version manifest to **V1.25** (`CURRENT_BUILD_VERSION = '1.25'`, `CURRENT_BUILD_LABEL = 'V1.25 LIVE'`).

---

## 2. Modified Files
- `src/pages/WebsitesDashboard.jsx`: Added alphabetical sorting by `site.name || site.title`.
- `src/config/version.js`: Bumped version to 1.25.
- `public/version.json`: Bumped version payload to 1.25.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
