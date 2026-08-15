# Restore Point: v1.7-w1-header-layout-rearrange

**Tag:** `v1.7-w1-header-layout-rearrange`  
**Date:** 15-08-2026  
**Status:** **Current**

---

## Summary of Changes

1. **W1 Two-Row Header Layout Rearrangement**:
   - **Row 1**: `Connected Websites` heading on top-left; global deployment/version indicator occupying the top-right position aligned with heading.
   - **Row 2**: `W1 | CONNECTED WEBSITES` pill badge and Server Type filter bar on left; `+ Add Website` button positioned on the far-right.

2. **Global Deployment & Version Indicator Enhancements**:
   - Displays `● V10.3 LIVE` when up-to-date.
   - Displays `Updating V10.4… 00:32` during deployment window.
   - Displays `🟢 V10.4 READY — Ctrl+F5` when live host confirms the new version is available.
   - Remains globally active across all Website Manager pages and routes.

---

## Verification Strategy

- `npm run build` compiled cleanly.
- Git commit, tag, and push.
