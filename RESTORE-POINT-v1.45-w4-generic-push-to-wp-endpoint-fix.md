# Restore Point v1.45 - Generic WordPress REST Endpoint Resolution for Custom Post Types

**Date**: 25-08-2026 11:00  
**Version**: `v1.45-w4-endpoint-fix`  
**Git Tag**: `v1.45-w4-generic-push-to-wp-endpoint-fix`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Generic REST Endpoint Resolver (`resolveWpEndpoint`)**:
   - Implemented `resolveWpEndpoint(base, page, authHeader, numericId)` in `src/services/wordpressApi.js`.
   - Supports standard Pages (`pages`), Posts (`posts`), and all WordPress Custom Post Types (`projects`, `portfolio`, `gallery`, `services`, `case_studies`, etc.).
   - Dynamically inspects `page.post_type`, verifies candidate REST endpoints via `GET /wp-json/wp/v2/${candidateEndpoint}/${numericId}?context=edit`, and performs REST type discovery (`/wp-json/wp/v2/types`) if missing or unverified.

2. **Production Deployment & Verification**:
   - Built Vite production bundle (`index-COpQv77G.js` / `index-CsR71w.js`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Updated static `version.json` and backend `/api/deployment/status` to `V1.45` (`w4pushendpointfix45`).
   - Verified Push to WP endpoint resolution for Surbiton project page (`page.id = 62580`, `page.post_type = 'projects'`):
     - `resolveWpEndpoint` resolves target endpoint: `/wp-json/wp/v2/projects/62580` (HTTP 200 SUCCESS — CONFIRMED!).
