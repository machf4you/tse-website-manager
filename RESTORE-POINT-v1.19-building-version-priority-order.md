# RESTORE POINT: v1.19-building-version-priority-order

**Date:** 17 August 2026  
**Version:** v1.19 (V10.10 Build)  
**Status:** STABLE baseline for active `Updating V10.X…` priority evaluation in `GlobalDeploymentIndicator.jsx`.

---

## 1. Objectives Accomplished
- **Building Version Priority Evaluation**:
  - Updated `GlobalDeploymentIndicator.jsx` condition ordering to evaluate `buildingVer && buildingVer !== liveVer` *before* checking `liveVer !== CURRENT_BUILD_VERSION`.
  - Ensures that when a server build target is in progress, the client immediately transitions to `Updating V10.X… (00:01)` with the active timer and spinner during the deployment window before switching to `🟢 V10.X READY — Ctrl+F5`.
- **Version Bump**:
  - Bumped version manifest to `10.10` (`CURRENT_BUILD_VERSION = '10.10'`).

---

## 2. Modified Files
- `src/components/GlobalDeploymentIndicator.jsx`: Prioritized `buildingVer` evaluation during active server builds.
- `src/config/version.js`: Bumped version to 10.10.
- `public/version.json`: Bumped version payload to 10.10.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
