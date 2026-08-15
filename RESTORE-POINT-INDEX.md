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
| v1.3-w4 | `v1.3-w4-wordpress-seo-write` | `[AUTO]` | 15-08-2026 15:10 | Fixed W4 WordPress write implementation to store Yoast Meta Title, Yoast Meta Description, and H1 content in WordPress REST API. | **Current** |

---

## Notes

- Restore points are created at the end of each approved milestone.
- The Current restore point represents the last approved, fully verified state of the project.
- All Superseded restore points remain accessible via their Git tags.
