# RESTORE POINT: v1.33-website-manager-new-vps-live

**Status:** STABLE baseline for TSE Website Manager Production Migration to New Dedicated VPS.

---

### Production Infrastructure & Verified Environment

- **Dedicated Applications VPS**: `77.245.157.66` (SSH Port: `22667`)
- **Node.js Runtime**: `v24.19.0` LTS
- **Application Root**: `/opt/tse-apps/website-manager/`
- **Frontend Root**: `/opt/tse-apps/website-manager/dist/`
- **Database Path**: `/opt/tse-apps/website-manager/shared_db/website_manager.db`
- **PM2 Backend Process**: `website-manager-api` (Status: `online`, Port: `3005`)

---

### Verified Public Domains & Endpoints

- **Frontend Domain**: `https://tse-website-manager.thesearchequation.co.uk/`
  - Public DNS: `77.245.157.66` (Confirmed across `1.1.1.1`, `8.8.8.8`, `9.9.9.9`)
  - Nginx Basic Authentication: Active (`auth_basic "Restricted Area"`)
  - Unauthenticated HTTP status: `HTTP 401`
  - Authenticated HTTP status: `HTTP 200`
  - Valid Let's Encrypt SSL Certificate active

- **Website Manager API**: `https://api-website-manager.thesearchequation.co.uk/`
  - Public DNS: `77.245.157.66` (Confirmed across `1.1.1.1`, `8.8.8.8`, `9.9.9.9`)
  - `GET /api/websites` -> `HTTP 200 OK` (Confirmed **14 websites** returned)
  - Valid Let's Encrypt SSL Certificate active

- **Page Auditor API**: `https://api-page-auditor.thesearchequation.co.uk/api/`
  - PM2 Backend Process: `page-auditor-api` (Status: `online`, Port: `8005`)
  - Status: `HTTP 200 OK` (`{"app":"TSE Page Auditor","status":"ok"}`)

---

### Data & Integrity Verification

- Database SQLite `PRAGMA integrity_check;`: `ok`
- Database file size: `18,026,496 bytes` (SHA256 checksum verified against production source)
- Websites loaded & verified: **14 websites**
- Application Code Commit: `81391ed2058448ebf5c7198bb1faec017adacaf4`
- Restore Point Tag: `v1.33-website-manager-new-vps-live`
