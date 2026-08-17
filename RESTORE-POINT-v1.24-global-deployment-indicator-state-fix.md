# RESTORE POINT: v1.24-global-deployment-indicator-state-fix

**Date:** 17 August 2026  
**Version:** v1.24 (V1.24 Build)  
**Status:** STABLE baseline for Global Deployment Indicator active build detection and state transitions.

---

## 1. Objectives Accomplished
- **Active Deployment State Detection**:
  - Updated `GlobalDeploymentIndicator.jsx` to parse both `data.building` and `data.version` from `/version.json`.
  - Priority evaluation sequence:
    1. `buildingVer && buildingVer !== liveVer && buildingVer !== CURRENT_BUILD_VERSION` -> **UPDATING** state (`⟳ UPDATING V1.24… [elapsed timer]`)
    2. `liveVer && liveVer !== CURRENT_BUILD_VERSION` -> **READY** state (`🟢 V1.24 READY — Ctrl+F5`)
    3. `liveVer === CURRENT_BUILD_VERSION` -> **LIVE** state (`● V1.24 LIVE`)
- **Fast Polling Frequency**:
  - Reduced background polling interval from 10 seconds to **3 seconds** for near-instant deployment status updates in the top-right application header.
- **Application Version Bump**:
  - Set version manifest to **V1.24** (`CURRENT_BUILD_VERSION = '1.24'`, `CURRENT_BUILD_LABEL = 'V1.24 LIVE'`).

---

## 2. Modified Files
- `src/components/GlobalDeploymentIndicator.jsx`: Added `buildingVer` evaluation and set polling to 3000ms.
- `src/config/version.js`: Bumped version to 1.24.
- `public/version.json`: Bumped version payload to 1.24.

---

## 3. Verification
- `npm run build`: Clean build (0 errors).
- Git push to GitHub `main` (`main -> main`).
