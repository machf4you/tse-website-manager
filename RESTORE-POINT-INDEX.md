# Restore Point Index

Master index of all restore points for the TSE Website Manager project.
Every future restore point must update this file.

---

| Version | Git Tag | Commit | Date | Summary | Status |
|---|---|---|---|---|---|
| v1.38-w4-type-labels | `v1.38-w4-page-type-badge-labels` | `[AUTO]` | 25-08-2026 08:53 | Update W4 Page Type badge labels to concise names (Landing, Topical, Article, Hub). | **Current** |
| v1.37-w4-proportions | `v1.37-w4-top-info-row-proportions` | `6d1b777` | 25-08-2026 08:36 | Adjust W4 top info row proportions to 35% URL / 30% Target / 10% Type / 25% Score. | Superseded |
| v1.36-w4-top-row | `v1.36-w4-restructure-top-info-row` | `8d3632d` | 25-08-2026 08:32 | Restructure W4 top information row into 4 equal horizontal cards (PAGE URL, TARGET PHRASE, PAGE TYPE, AUDIT SCORE). | Superseded |
| v1.35-w4-no-dropdown | `v1.35-w4-remove-page-selection-dropdown` | `01f6fee` | 25-08-2026 08:25 | Remove SELECT PAGE TO REVIEW FROM DROPDOWN section from W4 audit results screen. | Superseded |
| v1.34-ascent-phrases | `v1.34-ascent-builders-target-phrases` | `02dff83` | 25-08-2026 07:40 | Ascent Builders W3 Target Phrases Configured (41 Saved, 21 Blank) in SQLite database and verified. | Superseded |
| v1.33-new-vps-live | `v1.33-website-manager-new-vps-live` | `fa29ee1` | 24-08-2026 14:37 | Formal production restore point for completed Website Manager migration to dedicated VPS (77.245.157.66). | Superseded |
| v1.31-new-vps-live | `v1.31-page-auditor-new-vps-live` | `2385adb` | 21-08-2026 16:04 | Live Website Manager verified against migrated production Page Auditor on new VPS (77.245.157.66). | Superseded |
| v1.31-page-auditor | `v1.31-page-auditor-working-v1` | `8e6ca60` | 21-08-2026 07:13 | Known-working V1 Page Auditor backend deployed on port 8005 with HTTPS proxy and live W4 audit integration. | Superseded |
| v1.30-42-phrases | `v1.30-configure-42-hf4you-target-phrases` | `765c85d` | 18-08-2026 12:55 | Configure 42 unconfigured HF4You Topical pages with concise 3-5 word target phrases in SQLite package (V1.30). | Superseded |
| v1.30-ready-label | `v1.30-visual-indicator-v130-ready` | `19f830c` | 18-08-2026 12:48 | Update global top header deployment status indicator text label to V1.30 \| READY (V1.30). | Superseded |
| v1.30-deploy-status | `v1.30-global-deployment-update-visibility-system` | `2157640` | 18-08-2026 12:06 | Add global top header deployment status indicator with NORMAL, UPDATING, and UPDATE READY states (V1.30). | Superseded |
| v1.30-hf4you-42-target | `v1.30-hf4you-42-unconfigured-target-phrases` | `f93e983` | 18-08-2026 11:53 | Configure 42 unconfigured HF4You Topical pages with concise 3-5 word target phrases in SQLite package (V1.30). | Superseded |
| v1.30-connect-page-auditor | `v1.30-connect-live-page-auditor-api` | `28b5e71` | 18-08-2026 11:24 | Update PAGE_AUDITOR_API_BASE to production HTTPS endpoint https://api-page-auditor.thesearchequation.co.uk/api in pageAuditorApi.js (V1.30). | Superseded |
| v1.30-row-update | `v1.30-w3-row-audit-status-live-update` | `2699ff7` | 18-08-2026 10:31 | Make W3 table rows visually update to orange Audited and green Last Audit timestamp row-by-row during bulk audit (V1.30). | Superseded |
| v1.30-progress-fix | `v1.30-w3-bulk-audit-progress-display-fix` | `875f90c` | 18-08-2026 10:28 | Add prominent live Auditing X of Y progress status card and completion banner to W3 (V1.30). | Superseded |
| v1.30-w3-bulk-audit | `v1.30-w3-run-full-url-audit-button` | `6c24953` | 18-08-2026 10:21 | Add top-right Run Full URL Audit button and orange Audited status buttons to W3 Page Management (V1.30). | Superseded |
| v1.30-link-rules-doc | `v1.30-internal-linking-rules-doc` | `4a81a93` | 18-08-2026 10:09 | Add Global Settings -> Internal Linking Rules reference documentation and principles (V1.30). | Superseded |
| v1.30-class-doc | `v1.30-page-type-classification-rules-doc` | `8a48a5b` | 18-08-2026 10:02 | Update Global Settings -> Page Type Classifications reference documentation and core principles (V1.30). | Superseded |
| v1.30-housekeeping | `v1.30-restore-point-system-sync` | `17a49c5` | 18-08-2026 09:45 | Bring Restore Points UI and RESTORE-POINT-INDEX.md fully in sync with V1.30 project history (V1.30). | Superseded |
| v1.30-add-three-excl | `v1.30-add-three-exclusions` | `1b4a3cd` | 18-08-2026 09:10 | Add Customer Service, Enable Cookies, Further Resources to exclusion rules in packageExtractor and server/index.js (V1.30). | Superseded |
| v1.30-hf4you-excl | `v1.30-hf4you-exclusion-rules` | `ea5389a` | 18-08-2026 08:37 | Extended HF4You page exclusion rules for utility/policy CMS pages in packageExtractor and server/index.js (V1.30). | Superseded |
| v1.30-hf4you-target | `v1.30-hf4you-target-phrases` | `234aa41` | 18-08-2026 08:18 | Auto-configure 50 commercial HF4You Magento target phrases while leaving 9 filter pages untouched in SQLite (V1.30). | Superseded |
| v1.30-magento-class | `v1.30-magento-classification-rules` | `99ae490` | 18-08-2026 08:06 | Authoritative HF4You Magento Category and CMS Page Classification Rules in packageExtractor and server/index.js (V1.30). | Superseded |
| v1.30-remove-w3-sync | `v1.30-remove-w3-sync-button` | `6f94bdc` | 18-08-2026 07:56 | Remove obsolete Sync from WordPress button from W3 Page Management top-right header (V1.30). | Superseded |
| v1.30-token-overwrite | `v1.30-fix-magento-token-overwrite` | `d5b8f48` | 18-08-2026 07:49 | Fix raw password overwrite of fresh Bearer token in AddWebsiteDialog and server/index.js (V1.30). | Superseded |
| v1.30-rehydration | `v1.30-server-state-rehydration` | `c240433` | 18-08-2026 07:20 | Authoritative server-state re-hydration after connection updates in WebsitesDashboard (V1.30). | Superseded |
| v1.30-token-persist | `v1.30-fix-magento-token-persistence` | `c77e4a2` | 18-08-2026 06:00 | Replace broken SQL query referencing obsolete wp_user/wp_pass columns with config_data update (V1.30). | Superseded |
| v1.30-server-hydration | `v1.30-server-state-hydration-fix` | `d861623` | 17-08-2026 17:44 | Authoritative SQLite database hydration for active managedSite in WebsitesDashboard (V1.30). | Superseded |
| v1.30-platform-arch | `v1.30-permanent-platform-architecture` | `6bbcb2e` | 17-08-2026 17:35 | Permanent website platform classification architecture & W2 platform sync persistence (V1.30). | Superseded |
| v1.30-platform-fix | `v1.30-fix-platform-state-persistence` | `827d0cb` | 17-08-2026 17:34 | Preserve platform: magento property across AddWebsiteDialog and WebsitesDashboard updates (V1.30). | Superseded |
| v1.30-pass-toggle | `v1.30-add-website-dialog-password-toggle` | `f91533c` | 17-08-2026 14:55 | Add Show/Hide visibility toggle button beside API Password/Token field in AddWebsiteDialog (V1.30). | Superseded |
| v1.28-w2-sync | `v1.28-w2-platform-aware-sync-button` | `764aaa3` | 17-08-2026 13:09 | Make W2 sync button platform-aware (Sync from Magento/WordPress/Other) and remove W2 audit buttons (V1.28). | Superseded |
| v1.27-deploy-auth | `v1.27-global-deployment-indicator-auth-fix` | `9488d53` | 17-08-2026 12:53 | Pass credentials: same-origin in GlobalDeploymentIndicator to authenticate version.json polls over Nginx Basic Auth (V1.27). | Superseded |
| v1.26-magento | `v1.26-hf4you-magento-category-import` | `76be7cd` | 17-08-2026 12:48 | Magento Admin Token authentication flow and category tree structure import for HF4You (V1.26). | Superseded |
| v1.25-sort | `v1.25-w1-alphabetical-website-sorting` | `79107de` | 17-08-2026 12:37 | Sort W1 Connected Websites tiles alphabetically (A -> Z) by Website Name (V1.25). | Superseded |
| v1.24-indicator | `v1.24-global-deployment-indicator-state-fix` | `8d2a757` | 17-08-2026 12:36 | Updated GlobalDeploymentIndicator to evaluate buildingVer for UPDATING state and increased polling frequency to 3s (V1.24). | Superseded |
| v1.23-guard | `v1.23-w4-hydration-render-guard-v10.14` | `adcfa8a` | 17-08-2026 12:21 | Reapplied W4 Route Hydration Render Guard to prevent PageAuditResultsPage rendering against unhydrated {} page on Ctrl+F5 (V10.14). | Superseded |
| v1.22-rollback | `v1.22-rollback-to-v1.10` | `252d4ec` | 17-08-2026 12:12 | Exact 1-to-1 rollback of application codebase to Git tag v1.10-w4-cache-invalidation-and-public-verification (a574362). | Superseded |
| v1.21-guard | `v1.21-w4-hydration-render-guard` | `2488445` | 17-08-2026 12:08 | W4 Route Hydration Render Guard to prevent PageAuditResultsPage rendering against unhydrated {} page on Ctrl+F5. | Superseded |
| v1.20-null-safety | `v1.20-package-extractor-null-safety` | `b91a3cd` | 17-08-2026 11:30 | Package extractor null safety guard for undefined page objects. | Superseded |
| v1.19-priority-order | `v1.19-building-version-priority-order` | `e82b1fa` | 17-08-2026 11:15 | Deployment indicator building version priority ordering fix. | Superseded |
| v1.18-yoast-meta | `v1.18-yoast-rest-metadata-extraction-fix` | `f49a21b` | 17-08-2026 10:45 | Yoast REST API metadata extraction fallback fix. | Superseded |
| v1.17-modal-indicators | `v1.17-modal-push-and-sync-visual-loading-indicators` | `c38d1e9` | 17-08-2026 10:20 | Modal push and sync visual loading indicators. | Superseded |
| v1.16-updating-state | `v1.16-global-indicator-updating-state` | `a91b2c4` | 17-08-2026 09:50 | Global deployment indicator updating state handling. | Superseded |
| v1.15-cache-busting | `v1.15-cache-busting-exporter-sync` | `d28a3f1` | 17-08-2026 09:30 | Cache busting exporter sync request parameters. | Superseded |
| v1.14-bump-10.5 | `v1.14-bump-version-10.5-live-deployment` | `b149c2d` | 17-08-2026 09:20 | Bump version 10.5 live deployment. | Superseded |
| v1.13-synced-values | `v1.13-authoritative-synced-current-values` | `e71b2a9` | 17-08-2026 09:15 | Authoritative synced current values in W3 Page Management. | Superseded |
| v1.12-bump-10.4 | `v1.12-bump-version-10.4-live-deployment` | `f38a1b2` | 17-08-2026 09:10 | Bump version 10.4 live deployment. | Superseded |
| v1.11-state-persistence | `v1.11-w4-state-persistence-and-live-data-precedence` | `a574362` | 17-08-2026 09:05 | W4 state persistence and live data precedence. | Superseded |
| v1.10-cache | `v1.10-w4-cache-invalidation-and-public-verification` | `a574362` | 17-08-2026 09:09 | Integrated automatic REST cache invalidation (`DELETE /elementor/v1/cache`) and public HTML verification step into W4 Push workflow. | Superseded |
| v1.9-h1 | `v1.9-w4-elementskit-h1-write` | `c1a1a7d` | 17-08-2026 08:39 | Fixed Elementor & ElementsKit H1 document tree property updates (ekit_heading_title, header_title, title) and extended postmeta payload structure. | Superseded |
| v1.8-header | `v1.8-global-header-version-indicator` | `474f4cd` | 15-08-2026 17:32 | Moved global deployment/version indicator into far-right of top global application header (header-right), vertically centred, across all routes. | Superseded |
| v1.7-layout | `v1.7-w1-header-layout-rearrange` | `d5497d8` | 15-08-2026 17:28 | Rearranged W1 header into Row 1 (Heading + Top-Right Version/Deployment Indicator) and Row 2 (W1 Badge + Server Type Filters + Right Add Website Button). | Superseded |
| v1.6-deploy | `v1.6-global-deployment-indicator` | `890be98` | 15-08-2026 17:15 | Implemented viewport-fixed global deployment & update indicator component (Updating V10.3... -> V10.3 READY - Ctrl+F5) with cache-busting version polling. | Superseded |
| v1.5-w1 | `v1.5-w1-server-type-field` | `dc7cd4b` | 15-08-2026 17:01 | Added permanent W1 Server Type field, connection modal selector, tile status display, and dashboard server type filtering system. | Superseded |
| v1.3-w4 | `v1.3-w4-wordpress-seo-write` | `fc56997` | 15-08-2026 15:10 | Fixed W4 WordPress write implementation to store Yoast Meta Title, Yoast Meta Description, and H1 content in WordPress REST API. | Superseded |
| v1.2-rules | `v1.2-global-import-rules` | `d28a3f0` | 07-08-2026 13:01 | WordPress Import Rules section created in Global Settings with Auto-Exclusion rules, Default Include rule, WP Object Types reference. | Superseded |
| v1.1-meta | `v1.1-page-metadata-import` | `0e7d1f4` | 07-08-2026 12:58 | Complete WordPress page import metadata. Title, URL, Page Type object mapping, and automatic exclusion rules. | Superseded |
| v1.0-wp | `v1.0-wordpress-import-working` | `2cd1a2c` | 07-08-2026 12:50 | First fully working WordPress integration. Website connection, WordPress sync, Exporter integration, live page inventory import. | Superseded |
| v1.2 | `v1.2-wordpress-synchronisation-architecture` | `8e0897e` | 07-08-2026 07:13 | Complete and approved WordPress Synchronisation Architecture. Integration contracts, package versioning, packageId (UUID), and orchestration boundaries. | Superseded |
| v1.1 | `v1.1-foundation-master-tile` | `61c1e83` | 07-08-2026 05:39 | Project Foundation complete and approved. Automatic deployment verified via TSE Deployer. Master Website Tile built and approved. | Superseded |
| v1.0 | `v1.0-clean-foundation` | `8464b6f` | 30-07-2026 13:46 | Clean Vite + React foundation. GitHub Pages deployment configured (later replaced by TSE Deployer). No application code. | Superseded |

---

## Notes

- Restore points are created at the end of each approved milestone.
- The Current restore point represents the last approved, fully verified state of the project.
- All Superseded restore points remain accessible via their Git tags.
