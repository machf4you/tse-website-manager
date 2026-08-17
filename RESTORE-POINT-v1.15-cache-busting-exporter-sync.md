# RESTORE POINT: v1.15-cache-busting-exporter-sync

**Date:** 17 August 2026  
**Version:** v1.15 (V10.6 Build)  
**Status:** STABLE baseline for cache-busted Exporter package fetching upon Sync Data.

---

## 1. Objectives Accomplished
- **Cache-Busted Exporter Package Fetching**:
  - Updated `fetchTseWordPressExportPackage` in `src/services/exporterApi.js` to append `?nocache=1&t=${Date.now()}` to the Exporter REST endpoint URL.
  - Added `Cache-Control: no-cache` and `Pragma: no-cache` headers to ensure Nginx, Redis, and Cloudflare caches return a fresh export JSON from WordPress on every Sync Data request.
- **Version Bump**:
  - Bumped version manifest to `10.6` (`CURRENT_BUILD_VERSION = '10.6'`).

---

## 2. Modified Files
- `src/services/exporterApi.js`: Added cache-busting query params and headers to Exporter GET call.
- `src/config/version.js`: Bumped version to 10.6.
- `public/version.json`: Bumped version payload to 10.6.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
