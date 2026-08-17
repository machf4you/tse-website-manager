# Restore Point Index

Master index of all restore points for the TSE Website Manager project.
Every future restore point must update this file.

---

| Version | Git Tag | Commit | Date | Summary | Status |
|---|---|---|---|---|---|
| v1.0 | `v1.0-clean-foundation` | `8464b6f` | 30-07-2026 13:46 | Clean Vite + React foundation. GitHub Pages deployment configured (later replaced by TSE Deployer). No application code. | Superseded |
| v1.2-old | `v1.2-websites-dashboard` | `9f42b7e` | 30-07-2026 17:39 | Milestone 2 dashboard with sidebar, summary cards and website grid. Superseded when dashboard was cleared for master tile approach. | Superseded |
| v1.1 | `v1.1-foundation-master-tile` | `61c1e83` | 07-08-2026 05:39 | Project Foundation complete and approved. Automatic deployment verified via TSE Deployer. Master Website Tile built and approved. | Superseded |
| v1.2 | `v1.2-wordpress-synchronisation-architecture` | `8e0897e` | 07-08-2026 07:13 | Complete and approved WordPress Synchronisation Architecture. Integration contracts, package versioning, packageId (UUID), and orchestration boundaries frozen baseline before implementation. | Superseded |
| v1.0-wp | `v1.0-wordpress-import-working` | `2cd1a2c` | 07-08-2026 12:50 | First fully working WordPress integration. Website connection, WordPress sync, Exporter integration, live page inventory import, and W3 Page Management. | Superseded |
| v1.1-meta | `v1.1-page-metadata-import` | `0e7d1f4` | 07-08-2026 12:58 | Complete WordPress page import metadata. Title, URL, Page Type object mapping, and automatic exclusion rules. | Superseded |
| v1.2-rules | `v1.2-global-import-rules` | `[AUTO]` | 07-08-2026 13:01 | WordPress Import Rules section created in Global Settings with Auto-Exclusion rules, Default Include rule, WP Object Types reference, and Future Import Rules placeholders. | Superseded |
| v1.3-w4 | `v1.3-w4-wordpress-seo-write` | `fc56997` | 15-08-2026 15:10 | Fixed W4 WordPress write implementation to store Yoast Meta Title, Yoast Meta Description, and H1 content in WordPress REST API. | Superseded |
| v1.5-w1 | `v1.5-w1-server-type-field` | `dc7cd4b` | 15-08-2026 17:01 | Added permanent W1 Server Type field, connection modal selector, tile status display, and dashboard server type filtering system. | Superseded |
| v1.6-deploy | `v1.6-global-deployment-indicator` | `890be98` | 15-08-2026 17:15 | Implemented viewport-fixed global deployment & update indicator component (Updating V10.3... -> V10.3 READY - Ctrl+F5) with cache-busting version polling. | Superseded |
| v1.7-layout | `v1.7-w1-header-layout-rearrange` | `d5497d8` | 15-08-2026 17:28 | Rearranged W1 header into Row 1 (Heading + Top-Right Version/Deployment Indicator) and Row 2 (W1 Badge + Server Type Filters + Right Add Website Button). | Superseded |
| v1.8-header | `v1.8-global-header-version-indicator` | `474f4cd` | 15-08-2026 17:32 | Moved global deployment/version indicator into far-right of top global application header (header-right), vertically centred, across all routes. | Superseded |
| v1.9-h1 | `v1.9-w4-elementskit-h1-write` | `c1a1a7d` | 17-08-2026 08:39 | Fixed Elementor & ElementsKit H1 document tree property updates (ekit_heading_title, header_title, title) and extended postmeta payload structure. | Superseded |
| v1.10-cache | `v1.10-w4-cache-invalidation-and-public-verification` | `a574362` | 17-08-2026 09:09 | Integrated automatic REST cache invalidation (`DELETE /elementor/v1/cache`) and public HTML verification step into W4 Push workflow. | Superseded |
| v1.11-w4 | `v1.11-w4-state-persistence-and-live-data-precedence` | `39a132c` | 17-08-2026 10:10 | W4 Page-Selection State Persistence (Ctrl+F5) and Live Audit Data Precedence over stale local overrides. | Superseded |
| v1.12-v10.4 | `v1.12-bump-version-10.4-live-deployment` | `e326b17` | 17-08-2026 10:16 | Bump build version to 10.4 in src/config/version.js and public/version.json to trigger live deployment indicator. | Superseded |
| v1.13-sync | `v1.13-authoritative-synced-current-values` | `0586164` | 17-08-2026 10:28 | Authoritative W4 Current Value resolution from freshly synced WordPress exporter data and live audit snapshots. | Superseded |
| v1.14-v10.5 | `v1.14-bump-version-10.5-live-deployment` | `5f53fe3` | 17-08-2026 10:35 | Bump build version to 10.5 in src/config/version.js and public/version.json to trigger live deployment indicator. | Superseded |
| v1.15-sync | `v1.15-cache-busting-exporter-sync` | `[AUTO]` | 17-08-2026 10:46 | Add cache-busting query params and headers to fetchTseWordPressExportPackage in exporterApi.js. | **Current** |

---

## Notes

- Restore points are created at the end of each approved milestone.
- The Current restore point represents the last approved, fully verified state of the project.
- All Superseded restore points remain accessible via their Git tags.
