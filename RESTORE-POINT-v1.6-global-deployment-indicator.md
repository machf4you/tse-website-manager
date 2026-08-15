# Restore Point: v1.6-global-deployment-indicator

**Tag:** `v1.6-global-deployment-indicator`  
**Date:** 15-08-2026  
**Status:** **Current**

---

## Summary of Changes

1. **Global Deployment & Update Indicator Component**:
   - Built `GlobalDeploymentIndicator.jsx` mounted globally in `App.jsx` (visible across all pages/routes).
   - Real-time cache-busting poller against `/version.json?t=...` on the live host URL.
   - States:
     - `Updating V10.3… (00:15)` with elapsed deployment timer when a build update is in progress.
     - `🟢 V10.3 READY — Ctrl+F5` when live host URL confirms the new version is available.
     - Automatically resets/hides when loaded browser build matches deployed live version.

2. **Application Version Baseline**:
   - Set current application version constant to `10.3` in `src/config/version.js` and `public/version.json`.
   - Updated W1 dashboard header version badge to `● v10.3 LIVE`.

---

## Verification Strategy

- `npm run build` compiled cleanly.
- Verified global viewport overlay and poller logic.
- Git commit, tag, and push.
