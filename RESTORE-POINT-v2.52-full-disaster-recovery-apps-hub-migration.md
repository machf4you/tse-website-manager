# TSE Website Manager — Full Disaster-Recovery Restore Point

**Version:** `v2.52-wm-stable`  
**Git Tag:** `wm-v2.52-full-disaster-recovery`  
**Date:** 16 SEP 2026  
**Status:** Accepted Production Baseline / Full Disaster Recovery  
**Application:** Website Manager (`tse-website-manager`)  
**Production URL:** `https://tse-website-manager.thesearchequation.co.uk`  
**Backend API URL:** `https://tse-website-manager.thesearchequation.co.uk/api` (proxied to `127.0.0.1:3005`)

---

## 1. Executive Summary & Purpose

This document provides the authoritative **Full Disaster-Recovery Specification and Restore Point** for the TSE Website Manager application following the structural migration of the central Apps Platform Hub to `https://auth.thesearchequation.co.uk/`.

---

## 2. System Architecture & Inventory

1. **Frontend SPA:** React 18, Vite 5, Tailwind CSS, Lucide Icons, Radix UI.
   - Root URL `/` routes directly to `/w1-connected-sites` (Website Management).
   - "Back to Apps" button links to `https://auth.thesearchequation.co.uk/`.
2. **Backend API:** Node.js Express server (`server/index.js`, `server/db.js`) listening on internal port `3005`.
3. **Database Engine:** SQLite 3 with WAL mode enabled.
   - Primary Storage: `/opt/tse-apps/website-manager/shared_db/website_manager.db`
   - Backup Image: `/opt/tse-apps/backups/databases/website-manager/website_manager_disaster_recovery_v2.52.db`
4. **Process Supervision:** PM2 daemon (`website-manager-api`).
5. **Web Server & Reverse Proxy:** Nginx with Let's Encrypt TLS/SSL.

---

## 3. Cold Backup Verification

- **Full App Archive:** `/opt/tse-apps/backups/website-manager/2026-09-16-full/website-manager-app-2026-09-16-full.tar.gz`
- **Database Image:** `/opt/tse-apps/backups/databases/website-manager/website_manager_disaster_recovery_v2.52.db`
- **Nginx Config:** `/opt/tse-apps/backups/website-manager/2026-09-16-full/nginx/tse-website-manager.thesearchequation.co.uk.conf`
- **Restore Manifest:** `/opt/tse-apps/backups/website-manager/2026-09-16-full/RESTORE-MANIFEST.md`

Integrity verified via `sqlite3 PRAGMA integrity_check` (14 registered domains intact).
