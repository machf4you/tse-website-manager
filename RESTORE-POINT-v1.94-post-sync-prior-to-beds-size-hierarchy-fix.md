# Restore Point: V1.94-POST-SYNC-PRIOR-TO-BEDS-SIZE-HIERARCHY-FIX

**Date**: 03 September 2026 08:30  
**Version**: `V1.94`  
**Git Tag**: `v1.94-post-sync-prior-to-beds-size-hierarchy-fix`  
**Commit**: `21029fd`  
**Status**: `Verified Restore Point`

---

## 1. Scope & State Preserved

This restore point captures the state immediately following the Magento resync, before applying the definitive fix for the BEDS size category hierarchy grouping in W3 Manage Pages.

### Preserved Components:
1. **Raw Synced Package Data**: 151 records stored in SQLite database.
2. **Canonical Category URLs**: Clean 2-level canonical URLs (`/beds/...`, `/bed-frames/...`, `/divans/...`, `/headboards/...`, `/mattresses/...`).
3. **Stored User Configurations**: All 112 page configurations, target phrases, custom titles, manual priorities, and ⭐ work-priority flags.
4. **Visual Hierarchy Presentation Rules**: Non-clickable "Shop By..." visual separator layout, top category bold row styling, tree branch indentation.
