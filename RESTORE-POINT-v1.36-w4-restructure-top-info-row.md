# Restore Point v1.36 - W4 Top Information Row Restructured

**Date**: 25-08-2026 08:32  
**Version**: `v1.36-w4-top-row`  
**Git Tag**: `v1.36-w4-restructure-top-info-row`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Top Information Row Restructuring**:
   - Restructured the W4 top information section into 4 equal, consistent horizontal boxes on one row:
     1. `PAGE URL`
     2. `TARGET PHRASE`
     3. `PAGE TYPE`
     4. `AUDIT SCORE`
   - Positioned the AUDIT SCORE box alongside the other three cards in the main `.w4-info-grid` with matching card background (`#0c1427`), border (`1px solid rgba(255,255,255,0.08)`), padding, and border radius (`12px`).
   - Retained 100% of existing Audit Score behavior, score counting (`X / Y Passed`), issue counts, and color styling.

2. **Responsive CSS Layout**:
   - Configured `.w4-info-grid` with `grid-template-columns: repeat(4, minmax(0, 1fr))` on desktop.
   - Added responsive breakpoints: 2 columns on tablet screens (`<= 1024px`), 1 stacked column on mobile screens (`<= 640px`).

3. **Production Deployment & Verification**:
   - Built Vite production bundle (`index-CT7YYlkI.js`, `index-hEEIbvAK.css`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Updated static `version.json` and backend `/api/deployment/status` to `V1.36` (`w4toprow36`).
   - Verified live production CSS contains the 4-column layout rules and JS bundle renders all 4 card labels.
   - Verified zero database modifications, zero audit logic changes, and zero W3 page changes.
