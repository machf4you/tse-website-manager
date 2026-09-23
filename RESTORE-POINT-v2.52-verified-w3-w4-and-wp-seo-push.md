# TSE Website Manager — Full Disaster-Recovery Restore Point

**Version:** `v2.52-wm-stable`  
**Git Tag:** `wm-v2.52-verified-w3-w4-and-wp-seo-push`  
**Commit:** `db5ba6a0`  
**Date:** 23 SEP 2026  
**Status:** Accepted Production Baseline / Full Disaster Recovery  
**Application:** Website Manager (`tse-website-manager`)  
**Production URL:** `https://manage.thesearchequation.co.uk`  
**Backend API URL:** `https://manage.thesearchequation.co.uk/api` (port 3005)  

---

## 1. Executive Summary & Purpose

This document provides the authoritative **Full Disaster-Recovery Specification and Restore Point** for the TSE Website Manager application (V2.52), incorporating:
- **Accepted W3 / W4 Workflow:** Site-specific article inclusion/exclusion controls with persistent settings, single-page sync, re-audit, hydration, and audit timestamp verification.
- **Server-Side Verified WordPress SEO Push:** Secure server-side WordPress push engine (`server/wordpressSeoPusher.js`) with decoupled post title, Elementor H1 widget routing, Yoast / Rank Math SEO metadata payload formulation, and silent discard verification against live HTML/REST responses.
- **URL Exclusions & Classification Engine:** Robust URL pattern exclusion rules with retroactive database page classification sync.
- **Meta Title Page Display:** Strict UI display and canonical metadata handling without brand truncation.
- **Clean Global Dynamic ALT-Generator:** Dynamic ALT suggestion engine (`generateSmartProposedAlt`) operating strictly on image filename keywords and active `siteName`, eliminating hardcoded Ascent Builders contamination.
- **Comprehensive Regression Test Suites:** Full invariant protection via `scripts/test_w4_workflow_regression.mjs`, `scripts/test_server_seo_pusher_non_destructive.mjs`, and `scripts/test_secondary_phrase_persistence.mjs`.

---

## 2. System Architecture & Inventory

1. **Frontend SPA:** React 19, Vite 8, Tailwind CSS, Lucide Icons.
2. **Backend API:** Node.js Express server (`server/index.js`) listening on port `3005`.
3. **Database Engine:** SQLite 3 (`better-sqlite3`).
   - Primary Storage: `/opt/tse-apps/website-manager/server/website_manager.db` (or persistent storage).
4. **Process Supervision:** PM2 daemon (`website-manager-api` on port 3005).
5. **Web Server & Reverse Proxy:** Nginx with Let's Encrypt TLS/SSL.

---

## 3. Key Invariants & Verification Status

| Invariant | Implementation | Status |
| :--- | :--- | :--- |
| W4 Push Verification | Verification requires live HTML/REST match; rejects silent WordPress discard | Verified (14/14 tests pass) |
| Dynamic ALT Generator | Purely dynamic based on active site and image filename | Verified (0 brand contamination) |
| Non-Destructive SEO Push | Core WordPress payload omits `title`; routes H1 to Elementor, Meta Title to Yoast/Rank Math | Verified (8/8 tests pass) |
| Secondary Phrase Persistence | Secondary target phrases strictly preserved through updates and reloads | Verified (6/6 tests pass) |
| Multi-Site Isolation | Audit keys and configuration isolated per site ID | Verified |

---

## 4. Disaster Recovery & Restore Instructions

To restore Website Manager from this baseline:
1. Clone or checkout repository at commit `db5ba6a0` / tag `wm-v2.52-verified-w3-w4-and-wp-seo-push`.
2. Ensure `/opt/tse-apps/website-manager/server/.env` exists with required database paths and secrets.
3. In root: Run `npm install && npm test && npm run build`.
4. In `server/`: Run `npm install`.
5. Restart PM2 process:
   ```bash
   pm2 restart website-manager-api
   ```
6. Verify health: `curl -s http://localhost:3005/api/health` returns `{"status":"ok","service":"website-manager-api"}`.
