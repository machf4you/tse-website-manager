# RESTORE POINT: v1.27-global-deployment-indicator-auth-fix

**Date:** 17 August 2026  
**Version:** v1.27 (V1.27 Build)  
**Status:** STABLE baseline for Global Deployment Indicator authentication header passing (`credentials: 'same-origin'`).

---

## 1. Objectives Accomplished
- **Global Deployment Indicator Nginx Auth Fix**:
  - Updated `fetch('/version.json')` in `GlobalDeploymentIndicator.jsx` to explicitly pass `credentials: 'same-origin'`.
  - Transmits active Nginx Basic Auth session headers with the background version poll every 3 seconds, enabling the browser to read `/version.json` successfully (`HTTP 200 OK`) and enter the `⟳ UPDATING V1.27…` state during deployment windows.
- **Application Version Bump**:
  - Updated build version manifest to **V1.27** (`CURRENT_BUILD_VERSION = '1.27'`, `CURRENT_BUILD_LABEL = 'V1.27 LIVE'`).

---

## 2. Modified Files
- `src/components/GlobalDeploymentIndicator.jsx`: Added `credentials: 'same-origin'` to `fetch()` options.
- `src/config/version.js`: Bumped version to 1.27.
- `public/version.json`: Bumped version payload to 1.27.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
