# Restore Point: v1.5-w1-server-type-field

**Tag:** `v1.5-w1-server-type-field`  
**Date:** 15-08-2026  
**Status:** **Current**

---

## Summary of Changes

1. **W1 Permanent Server Type Infrastructure Field**:
   - Added `serverType` property to website records (`Caddy`, `LiteSpeed`, `Nginx`, `Apache`, `Unknown`).
   - Defaulted unassigned or unestablished sites to `"Unknown"`.
   - Populated empirical server types for Ascent Builders (`Caddy`) and Bathroom Upgrades (`LiteSpeed`).

2. **W1 Tile & Connection Dialog Integration**:
   - Displayed `Server Type` status badge in `WebsiteTile.jsx`.
   - Added Server Type selector field in `AddWebsiteDialog.jsx` to record and update web server technology when creating or editing sites.

3. **W1 Filtering System**:
   - Integrated Server Type filter control in `WebsitesDashboard.jsx` to filter connected website tiles by web server technology.

---

## Verification Strategy

- `npm run build` executed cleanly.
- Git commit, tag, and push.
