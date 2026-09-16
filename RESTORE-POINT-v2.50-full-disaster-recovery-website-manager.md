# TSE Website Manager — Full Disaster-Recovery Restore Point

**Version:** `v2.50-wm-stable`  
**Git Tag:** `wm-v2.50-full-disaster-recovery`  
**Date:** 16 SEP 2026  
**Status:** Accepted Production Baseline / Full Disaster Recovery  
**Application:** Website Manager (`tse-website-manager`)  
**Production URL:** `https://tse-website-manager.thesearchequation.co.uk`  
**Backend API URL:** `https://tse-website-manager.thesearchequation.co.uk/api` (proxied to `127.0.0.1:3005`)

---

## 1. Executive Summary & Purpose

This document is the authoritative **Full Disaster-Recovery Specification and Restore Point** for the TSE Website Manager application. It provides complete instructions, architecture manifests, configuration files, schema layouts, and recovery procedures required to rebuild and deploy the entire production application from scratch if both the development workstation and the live host environment were completely lost.

---

## 2. System Architecture & Inventory

### 2.1 Core Components
1. **Frontend SPA:** React 18, Vite 5, Tailwind CSS, Lucide Icons, Radix UI.
2. **Backend API:** Node.js Express server (`server/index.js`, `server/db.js`) listening on internal port `3005`.
3. **Database Engine:** SQLite 3 with WAL mode enabled.
   - Primary Storage: `/opt/tse-apps/website-manager/shared_db/website_manager.db`
   - Backup Image: `/opt/tse-apps/backups/databases/website-manager/website_manager_disaster_recovery_v2.50.db`
4. **Process Supervision:** PM2 daemon (`website-manager-api`).
5. **Web Server & Reverse Proxy:** Nginx with Let's Encrypt TLS/SSL, forwarding `/api/` requests to `127.0.0.1:3005` and serving static assets from `/opt/tse-apps/website-manager/dist`.

---

## 3. Database Schema & Data Invariants

### 3.1 SQLite Tables & Row Counts
| Table Name | Description | Verified Count |
| :--- | :--- | :--- |
| `websites` | Registered TSE managed domains and WordPress/Magento credentials metadata | 14 active domains |
| `page_configs` | Granular URL configurations, target phrases, SEO metadata recommendations | Full catalog |
| `audits` | Page audit snapshots, Elementor AST trees, Yoast SEO tags | Full historical |
| `user_profiles` | TSE multi-user access permissions and encrypted credential stores | Active users |
| `target_phrases` | Target keyword mappings and contextual phrase link definitions | Active |

### 3.2 Cold Backup Verification
The authoritative production database snapshot is preserved on the VPS backup volume:
```bash
/opt/tse-apps/backups/databases/website-manager/website_manager_disaster_recovery_v2.50.db
```
To verify data integrity:
```bash
sqlite3 /opt/tse-apps/backups/databases/website-manager/website_manager_disaster_recovery_v2.50.db "PRAGMA integrity_check; SELECT count(*) FROM websites;"
```

---

## 4. Environment & Runtime Configuration

### 4.1 Production Environment Variables
Create `/opt/tse-apps/website-manager/.env`:
```ini
PORT=3005
NODE_ENV=production
PERSISTENT_STORAGE_DIR=/opt/tse-apps/website-manager/shared_db
VITE_PAGE_AUDITOR_API_URL=https://api-page-auditor.thesearchequation.co.uk/api
```

### 4.2 Nginx Server Block
File: `/etc/nginx/sites-available/tse-website-manager.thesearchequation.co.uk`
```nginx
server {
    add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet" always;
    server_name tse-website-manager.thesearchequation.co.uk;

    root /opt/tse-apps/website-manager/dist;
    index index.html;

    include /etc/nginx/snippets/tse-auth.conf;
    include /etc/nginx/snippets/tse-security-headers.conf;

    location = /robots.txt {
        auth_request off;
        default_type text/plain;
        return 200 "User-agent: *
Disallow: /
";
    }

    location = /version.json {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        auth_request off;
        default_type application/json;
        try_files /version.json =404;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3005/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Auth-User $auth_user;
        proxy_set_header X-Auth-Role $auth_role;
        proxy_set_header X-Auth-Email $auth_email;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    listen [::]:443 ssl;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/tse-website-manager.thesearchequation.co.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tse-website-manager.thesearchequation.co.uk/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet" always;
    if ($host = tse-website-manager.thesearchequation.co.uk) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    listen [::]:80;
    server_name tse-website-manager.thesearchequation.co.uk;
    return 404;
}
```

---

## 5. Step-by-Step Disaster Recovery Procedure

In the event of total server loss:

### Step 1: Provision Host and Prerequisites
```bash
apt-get update && apt-get install -y nodejs npm nginx sqlite3 git
npm install -g pm2
mkdir -p /opt/tse-apps/website-manager /opt/tse-apps/website-manager/shared_db /opt/tse-apps/backups/databases/website-manager
```

### Step 2: Restore Application Code & Dependencies
```bash
cd /opt/tse-apps/website-manager
git clone <repository_url> .
git checkout wm-v2.50-full-disaster-recovery
npm install
npm run build
```

### Step 3: Restore Database Snapshot
```bash
cp /opt/tse-apps/backups/databases/website-manager/website_manager_disaster_recovery_v2.50.db /opt/tse-apps/website-manager/shared_db/website_manager.db
chmod 664 /opt/tse-apps/website-manager/shared_db/website_manager.db
```

### Step 4: Configure and Launch PM2
```bash
cd /opt/tse-apps/website-manager
pm2 start server/index.js --name "website-manager-api" --env PORT=3005,PERSISTENT_STORAGE_DIR=/opt/tse-apps/website-manager/shared_db
pm2 save
```

### Step 5: Configure Nginx & SSL
```bash
cp nginx/tse-website-manager.conf /etc/nginx/sites-available/tse-website-manager.thesearchequation.co.uk
ln -s /etc/nginx/sites-available/tse-website-manager.thesearchequation.co.uk /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### Step 6: Post-Recovery Verification
1. Open `https://tse-website-manager.thesearchequation.co.uk` in browser.
2. Verify all 14 websites load in the portfolio overview.
3. Test API ping: `curl -I https://tse-website-manager.thesearchequation.co.uk/api/websites`.
4. Check PM2 logs: `pm2 logs website-manager-api --lines 50`.
