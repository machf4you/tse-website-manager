# Restore Point v1.40 - Sync Application Restore Points Display in Global Settings

**Date**: 25-08-2026 09:51  
**Version**: `v1.40-w4-settings-sync`  
**Git Tag**: `v1.40-w4-global-settings-restore-point-sync`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Global Settings Restore Point Visibility Sync**:
   - Refactored `getRestorePointIndex()` in `src/services/restorePointService.js` to ensure all authoritative code restore points in `src/data/restorePointData.js` are always loaded and displayed in Global Settings.
   - Preserved single source of truth (`restorePointData.js` / `RESTORE-POINT-INDEX.md`) without duplicating restore points in SQLite or localStorage.
   - Guaranteed that all recent W4 restore points (v1.35, v1.36, v1.37, v1.38, v1.39) and future restore points automatically appear in the Global Settings Restore Points list.

2. **Production Deployment & Verification**:
   - Built Vite production bundle (`index-DTyFq3sE.js`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Updated static `version.json` and backend `/api/deployment/status` to `V1.40` (`w4settingssync40`).
   - Verified that all 5 recent W4 restore points and v1.40 are present in the frontend index array.
