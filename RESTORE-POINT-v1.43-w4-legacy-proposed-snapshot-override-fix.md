# Restore Point v1.43 - Ignore Legacy Database proposedTitle Snapshots in Favor of Generated Recommendations

**Date**: 25-08-2026 10:31  
**Version**: `v1.43-w4-snapshot-fix`  
**Git Tag**: `v1.43-w4-legacy-proposed-snapshot-override-fix`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Legacy Database Snapshot Resolution Helper (`resolveProposedField`)**:
   - Implemented `resolveProposedField(savedVal, actualVal, recVal)` in `src/utils/seoRecommendationGenerator.js`.
   - Distinguishes unedited legacy database snapshots from genuine user overrides:
     - If saved `proposedTitle` matches `actualMetaTitle` (ignoring whitespace/case), it is recognized as a legacy unedited snapshot and IGNORED in favor of `recommendations.proposedTitle`.
     - If saved `proposedTitle` differs from `actualMetaTitle`, it is recognized as a genuine user edit and PRESERVED.
     - If no saved value exists, `recommendations.proposedTitle` is used.

2. **Production Deployment & Verification**:
   - Built Vite production bundle (`index-D0q71sXy.js`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Updated static `version.json` and backend `/api/deployment/status` to `V1.43` (`w4legacysnapshotfix43`).
   - Verified live test page `https://www.ascentbuilders.co.uk/projects/2-bedroom-bathroom-loft-conversion-in-surbiton/` (`targetPhrase = "Builders Projects"`):
     - **Proposed Meta Title**: `"Builders Projects: 2 Bedroom Loft conversion in Surbiton"` (56 chars — CONFIRMED!)
     - **Proposed Meta Description**: `"Explore our Builders Projects showcase featuring a 2 bedroom bathroom loft conversion in surbiton. Contact Ascent Builders today for expert building services."` (158 chars — CONFIRMED!)
     - **Proposed H1**: `"Builders Projects: 2 Bedroom Loft conversion in Surbiton"` (56 chars — CONFIRMED!)
