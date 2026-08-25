# Restore Point v1.34 - Ascent Builders W3 Target Phrases Configured

**Date**: 25-08-2026 07:40  
**Version**: `v1.34-ascent-phrases`  
**Git Tag**: `v1.34-ascent-builders-target-phrases`  
**VPS Environment**: `77.245.157.66` (Dedicated VPS, SSH Port 22667)  
**Database Backup Location**: `/opt/tse-apps/website-manager/shared_db/website_manager.db.bak_ascent_phrases_perfect_20260825_063246`  
**Frontend URL**: `https://tse-website-manager.thesearchequation.co.uk/`  
**API URL**: `https://api-website-manager.thesearchequation.co.uk/api`

---

## Accomplished Objectives

1. **Target Phrases Configured & Verified**:
   - Total Ascent Builders W3 pages processed: **62**
   - Populated Primary Target Phrases: **41**
   - Intentionally Blank / Review Required: **21** (utility, policy, template, portfolio, and form pages)

2. **Strict Rules Applied**:
   - **Homepage**: Set to `Loft Conversions Surrey`
   - **Main Service Pages**: Core service names without location (`House Extensions`, `Garage Conversions`, `Renovations and Refurbishments`, `Garden Offices and Garden Rooms`), with `Loft Conversions Surrey` retained for the principal service page.
   - **Main Builders Page**: `Builders in Surrey & South London`
   - **Location Pages**: Exact service + location format (`Builders in Epsom`, `Loft Conversions Epsom`, `Loft Conversions Cobham`, etc.)
   - **Articles**: Concise, natural search queries (`How much value does a loft conversion add`, `Loft conversion ideas`, `Types of home extensions`, `Can builders work on Sunday`, etc.)
   - **Commercial Landing Page**: `Loft Conversions` for `/landing-page-loft-conversions/`
   - **Excluded / Blank Pages**: All 21 non-commercial/utility/portfolio pages remain blank.

3. **Database Integrity**:
   - Created full SQLite database backup at `/opt/tse-apps/website-manager/shared_db/website_manager.db.bak_ascent_phrases_perfect_20260825_063246`.
   - Updated `wp_packages` and synchronized `page_configurations` for site `1`.
   - Preserved all Meta Titles, Meta Descriptions, H1s, URLs, page types, and exclusions.

4. **Production Build & Verification**:
   - Built Vite production bundle (`index-DrJaQ58q.js`) and deployed to `/opt/tse-apps/website-manager/dist/`.
   - Verified HTTPS Basic Auth (`admin:admin`) returns HTTP 200 OK.
   - Verified unauthenticated access returns HTTP 401.
   - Verified production API `https://api-website-manager.thesearchequation.co.uk/api/websites/1/package` returns 41 populated target phrases and 21 blank target phrases.
