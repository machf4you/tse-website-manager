# Restore Point v1.44 - Fix Brand Suffix Handling in Legacy Proposed Title Detection

**Date**: 25-08-2026 10:50  
**Version**: `v1.44-w4-title-brand-fix`  
**Git Tag**: `v1.44-w4-legacy-title-brand-suffix-detection-fix`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Brand Suffix Normalization in `resolveProposedField`**:
   - Updated `resolveProposedField` in `src/utils/seoRecommendationGenerator.js` to strip site/brand suffix (e.g., `- Ascent Builders`) from the actual live title string before comparing against legacy database `proposedTitle`.
   - Guaranteed that legacy database title snapshots that lack the brand suffix are correctly recognized as unedited legacy values and IGNORED, allowing generated recommendations to populate the Proposed Meta Title field.

2. **Production Deployment & Verification**:
   - Built Vite production bundle (`index-COpQv77G.js` / `index-B1z9kX.js`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Updated static `version.json` and backend `/api/deployment/status` to `V1.44` (`w4titlebrandfix44`).
   - Verified live test page `https://www.ascentbuilders.co.uk/projects/2-bedroom-bathroom-loft-conversion-in-surbiton/` (`targetPhrase = "Builders Projects"`):
     - **Proposed Meta Title**: `"Builders Projects: 2 Bedroom Loft conversion in Surbiton"` (56 chars — CONFIRMED!)
     - **Proposed Meta Description**: `"Explore our Builders Projects showcase featuring a 2 bedroom bathroom loft conversion in surbiton. Contact Ascent Builders today for expert building services."` (158 chars — CONFIRMED!)
     - **Proposed H1**: `"Builders Projects: 2 Bedroom Loft conversion in Surbiton"` (56 chars — CONFIRMED!)
