# Restore Point v1.42 - Fix W4 Proposed Meta Title Fallback Order

**Date**: 25-08-2026 10:19  
**Version**: `v1.42-w4-title-fallback-fix`  
**Git Tag**: `v1.42-w4-proposed-title-fallback-order-fix`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Fixed Proposed Meta Title Fallback Order**:
   - Corrected fallback logic in `PageAuditResultsPage.jsx` and `W4FixIssueDialog.jsx` so that:
     1. Explicit user saved proposed override takes 1st priority (`proposedTitle`).
     2. Generated recommendation takes 2nd priority (`recommendations.proposedTitle`).
     3. Actual Live Meta Title serves only as 3rd priority ultimate fallback (`actualMetaTitle`).
   - Removed `page.metaTitle` and `overrideObj.metaTitle` from the middle of the proposed fallback chains so Actual Live values can no longer short-circuit generated recommendations.

2. **Production Deployment & Verification**:
   - Built Vite production bundle (`index-COpQv77G.js` / `index-B5k-f579.js`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Updated static `version.json` and backend `/api/deployment/status` to `V1.42` (`w4titlefallbackfix42`).
   - Verified live test page `https://www.ascentbuilders.co.uk/projects/2-bedroom-bathroom-loft-conversion-in-surbiton/` (`targetPhrase = "Builders Projects"`):
     - **Proposed Meta Title**: `"Builders Projects: 2 Bedroom Loft conversion in Surbiton"` (56 chars — CONFIRMED!)
     - **Proposed Meta Description**: `"Explore our Builders Projects showcase featuring a 2 bedroom bathroom loft conversion in surbiton. Contact Ascent Builders today for expert building services."` (158 chars — CONFIRMED!)
     - **Proposed H1**: `"Builders Projects: 2 Bedroom Loft conversion in Surbiton"` (56 chars — CONFIRMED!)
