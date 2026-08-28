# Restore Point v1.51 - W4 Audit Freshness & Timestamps Indicators (LAST AUDIT vs LAST SYNC)

**Date**: 28-08-2026 09:28  
**Version**: `v1.51-w4-freshness-indicators-fix`  
**Git Tag**: `v1.51-w4-audit-freshness-and-timestamps-indicators-fix`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Explicit Timestamps Header Bar (`PageAuditResultsPage.jsx`)**:
   - Displays `LAST AUDIT: [timestamp]` and `LAST SYNC: [timestamp]` side-by-side in the W4 header block.
   - **LAST AUDIT**: Retrieved from `storedAuditRecord.lastAuditTimestamp` / `liveAuditData.lastAuditTimestamp` / `page_audits` SQLite DB.
   - **LAST SYNC**: Retrieved from `site.lastSyncTimestamp` / `wp_packages` stored sync package timestamp.

2. **Visual Stale Audit Warning Banner**:
   - When `lastSyncMs > lastAuditMs` (Last Sync occurred AFTER Last Audit), W4 displays a prominent amber warning banner:
     `"Live data has changed since this audit. Re-run Audit for current results."`
   - Highlights the existing **Re-run Audit ▷** button with a glowing amber border and shadow.

3. **Automatic Hiding on Fresh Audit**:
   - When `lastAuditMs >= lastSyncMs` (Last Audit is equal to or AFTER Last Sync), the stale warning banner automatically hides.

4. **Production Deployment & Verification**:
   - Built Vite production bundle (`index-COp0h39.js` / `index-Bf6tN1x9.js`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Updated static `version.json` and backend `/api/deployment/status` to `V1.51` (`w4auditfreshnessandtimestampsindicators51`).
