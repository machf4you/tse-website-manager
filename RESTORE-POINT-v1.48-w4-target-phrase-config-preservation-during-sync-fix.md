# Restore Point v1.48 - Target Phrase & Configuration Preservation During WordPress Content Sync

**Date**: 25-08-2026 11:53  
**Version**: `v1.48-w4-config-preservation-fix`  
**Git Tag**: `v1.48-w4-target-phrase-config-preservation-during-sync-fix`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Strict Isolation Between Content Sync & Targeting Config (`ManageWebsitePage.jsx`)**:
   - Updated `exportedPages` mapping in `ManageWebsitePage.jsx` so `targetPhrase` / `target`, `seoPageType`, and `priority` are strictly preserved from Website Manager configuration data (`savedConfigs` / `page_configurations`).
   - Ensured a null/empty response from WordPress REST API can **never** wipe an existing Target Phrase or page configuration.

2. **Explicit Config Retention on Save (`PageAuditResultsPage.jsx`)**:
   - Updated `handleSaveFix` in `PageAuditResultsPage.jsx` so `targetPhrase` and `target` are explicitly locked into `page_configurations` when saving fixes.
   - Guaranteed `recTargetPhrase` resolves from `overrideObj` or `rawCurrentPage` and locks `targetPhrase` on `currentPage`.

3. **Production Deployment & Verification**:
   - Built Vite production bundle (`index-Bg8d3n2C.js` / `index-Bb98bS_x.js`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Updated static `version.json` and backend `/api/deployment/status` to `V1.48` (`w4targetphrasepreservationfix48`).
   - Verified that Target Phrase `"Builders Projects"` and generated recommendations are preserved across Save → Push → Sync → Re-run Audit workflow.
