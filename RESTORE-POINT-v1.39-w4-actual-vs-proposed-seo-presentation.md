# Restore Point v1.39 - W4 Optimise Page SEO Modal Actual vs Proposed Presentation

**Date**: 25-08-2026 09:39  
**Version**: `v1.39-w4-actual-proposed`  
**Git Tag**: `v1.39-w4-actual-vs-proposed-seo-presentation`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Clear Actual vs Proposed Presentation in W4 Modal**:
   - Restructured `W4FixIssueDialog.jsx` and `W4FixIssueDialog.css` to render an explicit, clean Actual → Proposed card for each of the three core SEO elements:
     - **Meta Title**: Read-only `ACTUAL (LIVE)` box + Editable `PROPOSED META TITLE` input field (Target: 50–60 chars).
     - **Meta Description**: Read-only `ACTUAL (LIVE)` box + Editable `PROPOSED META DESCRIPTION` textarea (Target: 150–160 chars).
     - **H1 Heading Tag**: Read-only `ACTUAL (LIVE)` box + Editable `PROPOSED H1 TAG` input field.

2. **Strict Per-Field Independence & Fallback Bug Fix**:
   - Ensured `actualMetaTitle`, `actualMetaDescription`, and `actualH1` are derived directly from live/synced page data (`snap` or `rawCurrentPage`) without cross-field fallbacks.
   - If an actual value is genuinely blank, it displays `[Blank / Not Set]` and leaves the proposed field blank until entered.
   - Fixed `handlePushToWordPress()` so `metaTitleVal`, `metaDescVal`, and `h1Val` are sent independently without falling back to title strings when a field is empty.

3. **Preserved Sequential Workflow & Audit Logic**:
   - Maintained the exact 4-step workflow: `1. Save Changes` → `2. Push to WP` → `3. Sync Data` → `4. Re-run Audit`.
   - Zero changes made to W3 Manage Pages, audit logic, database schemas, or SEO target phrases.

4. **Production Deployment & Verification**:
   - Built Vite production bundle (`index-J7ExdlGR.js`, `index-DHLIS9Mm.css`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Updated static `version.json` and backend `/api/deployment/status` to `V1.39` (`w4actualproposed39`).
   - Verified live production JS bundle contains `ACTUAL (LIVE)` and `PROPOSED META TITLE (EDITABLE)`.
