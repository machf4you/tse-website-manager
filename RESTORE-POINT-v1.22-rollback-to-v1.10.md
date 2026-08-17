# RESTORE POINT: v1.22-rollback-to-v1.10

**Date:** 17 August 2026  
**Version:** v1.22 (V10.13 Build Rollback)  
**Status:** STABLE rollback. The application source code has been restored 1-to-1 to the exact codebase of Git tag `v1.10-w4-cache-invalidation-and-public-verification` (`a574362`).

---

## 1. Objectives Accomplished
- **Exact Codebase Rollback**:
  - Restored all application source files (`src/`, `public/`, utilities, pages, and components) to match Git tag `v1.10-w4-cache-invalidation-and-public-verification` (`a574362`).
  - Completely discarded all experimental changes from `v1.11`, `v1.12`, `v1.13`, `v1.14`, `v1.15`, `v1.16`, `v1.17`, `v1.18`, `v1.19`, `v1.20`, and `v1.21`.
- **Version Manifest Bump**:
  - Set version manifest to **V10.13** (`CURRENT_BUILD_VERSION = '10.13'`) so that live server deployment indicator detects the new release payload.

---

## 2. Modified Files
- `src/`: Restored 1-to-1 to Git tag `v1.10-w4-cache-invalidation-and-public-verification`.
- `public/version.json`: Updated version payload to `10.13`.
- `src/config/version.js`: Updated version label to `10.13`.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
