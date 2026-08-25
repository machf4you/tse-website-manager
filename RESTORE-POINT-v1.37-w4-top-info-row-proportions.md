# Restore Point v1.37 - W4 Top Information Row Proportions Adjusted

**Date**: 25-08-2026 08:36  
**Version**: `v1.37-w4-proportions`  
**Git Tag**: `v1.37-w4-top-info-row-proportions`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Top Information Row Proportions Adjusted**:
   - Adjusted grid layout proportions of the 4 horizontal information cards in W4 (`.w4-info-grid`):
     - `PAGE URL`: **35%** (`3.5fr`)
     - `TARGET PHRASE`: **30%** (`3fr`)
     - `PAGE TYPE`: **10%** (`1fr`)
     - `AUDIT SCORE`: **25%** (`2.5fr`)
   - Gives PAGE URL maximum width to accommodate long URLs and page titles comfortably, while keeping PAGE TYPE compact for short badge labels like "Landing Page".

2. **Preserved Responsiveness & Behavior**:
   - Retained responsive CSS breakpoints: 2 columns on tablet (`<= 1024px`), 1 stacked column on mobile (`<= 640px`).
   - Retained 100% of existing Audit Score behavior, score counting (`X / Y Passed`), issue counts, and color styling.

3. **Production Deployment & Verification**:
   - Built Vite production bundle (`index-pcvBTFmQ.js`, `index-DlzakmF6.css`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Updated static `version.json` and backend `/api/deployment/status` to `V1.37` (`w4proportions37`).
   - Verified live production CSS contains `grid-template-columns: 3.5fr 3fr 1fr 2.5fr`.
   - Verified zero database modifications, zero audit logic changes, and zero W3 page changes.
