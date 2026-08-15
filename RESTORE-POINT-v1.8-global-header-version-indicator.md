# Restore Point: v1.8-global-header-version-indicator

**Tag:** `v1.8-global-header-version-indicator`  
**Date:** 15-08-2026  
**Status:** **Current**

---

## Summary of Changes

1. **Top Application Header Version Placement**:
   - Moved the `GlobalDeploymentIndicator` component inside the top global application header (`app-header -> header-right`).
   - Placed at the far right of the top navigation bar, vertically centered, completely outside W1 page content.
   - Visible globally in the exact same location across all routes (W1, Manage Website, W4, W5, Global Settings).

2. **Deployment States**:
   - `● V10.3 LIVE` (up-to-date)
   - `Updating V10.4… 00:32` (deploying with live elapsed timer)
   - `🟢 V10.4 READY — Ctrl+F5` (confirmed live on server)

3. **W1 Content Layout**:
   - Row 1: `Connected Websites` heading.
   - Row 2: `W1 | CONNECTED WEBSITES` badge and Server Type filter bar (left) | `+ Add Website` button (right).

---

## Verification Strategy

- `npm run build` compiled cleanly.
- Git commit, tag, and push.
