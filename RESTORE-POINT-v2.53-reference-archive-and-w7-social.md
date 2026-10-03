# RESTORE POINT: v2.53-reference-archive-and-w7-social

**Title:** Website Manager V2.53 — Reference Archive & W7 Social Full Production Restore Point  
**App:** Website Manager  
**Version:** V2.53  
**Date:** 03-10-2026 04:51  
**Git Tag:** `wm-v2.53-2026-10-03`  
**Commit:** `7956fd0c`  
**Status:** Current  

### Description
Full production restore point including Reference Archive, W7 Social, and database snapshot.

---

### Backup Artifact Locations & Verification

1. **Full Application Archive:**
   - **Path:** `/opt/tse-apps/backups/website-manager/wm-v2.53-2026-10-03-full-restore-point.tar.gz`
   - **Size:** 144 MB
   - **Verification:** Verified non-zero byte size (144MB tar.gz) and archived directory structure over SSH.

2. **Database Backup:**
   - **Path:** `/opt/tse-apps/backups/databases/website-manager/db_wm_2026-10-03.db`
   - **Size:** 102 MB
   - **Verification:** Verified safe `.backup` SQLite snapshot.

---

### Included Components

- **Application Source Code:** `server/`, `src/`, `public/`, `scripts/`, `package.json`, `vite.config.js`.
- **Frontend Production Assets:** `dist/` compiled Vite release.
- **Server Backend & Database:** SQLite production database `shared_db/website_manager.db`.
- **W7 Social Module:** Full video generation, Creatomate rendering, real-time bundle.social status polling, and publication history database sync.
- **Global Settings & Reference Archive:**
  - Data-driven extensible reference guide architecture inside Global Settings.
  - Complete *Facebook + Instagram Business Connection* setup guide.
  - All 9 high-resolution screenshot assets (`public/reference-archive/fb-ig-assets/image1.png` through `image9.png`).
- **Configuration & Persistence:** Configuration templates, version metadata, and restore point index.

---

### Retained Website Manager Restore Points (Retention Limit: 3)

1. **`wm-v2.53-2026-10-03` (Current):** Website Manager V2.53 — Reference Archive & W7 Social Full Production Restore Point (03-10-2026)
2. **`wm-v2.52.1-full-disaster-recovery` (Superseded):** Website Manager V2.52.1 Full Disaster-Recovery Milestone (18-09-2026)
3. **`v2.52-full-disaster-recovery-apps-hub-migration` (Superseded):** TSE Website Manager — Full Disaster-Recovery Restore Point (16-09-2026)

*(Note: Oldest restore point `wm-v2.50-full-disaster-recovery` was pruned to maintain the strict retention limit of 3 Website Manager restore points.)*
