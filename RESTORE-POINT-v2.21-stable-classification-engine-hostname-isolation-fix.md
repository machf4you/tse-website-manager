# Restore Point: RESTORE-POINT-v2.21-stable-classification-engine-hostname-isolation-fix

**Timestamp**: 2026-09-10 10:20 UTC  
**Git Tag**: 2.21-stable-classification-engine-hostname-isolation-fix  
**Base Commit**: [AUTO]  
**Live Bundle**: dist/assets/index-BPZrR2Xr.js  
**Deployment Target**: Dedicated Applications VPS (77.245.157.66)  
**Service Status**: All services online (website-manager-api port 3005, page-auditor-api port 8005, site-registry-api port 3006, 	se-auth-service port 3001)

---

## 1. Summary of Changes

Fixed latent classification engine bug in src/utils/packageExtractor.js:
1. **Hostname & Domain Isolation in Exclusion Matching**:
   - URL exclusion patterns now operate strictly against the extracted URL pathname and slug (pathname / cleanSlug / slugSegments).
   - Domain names / hostnames are completely stripped before pattern evaluation, ensuring domain names containing generic keywords like "search" (	hesearchequation.com), "tag" (	agservices.co.uk), "date" (dating.co.uk), "feed" (nimalfeed.co.uk), or "cart" (gocart.co.uk) can never falsely trigger exclusions.
2. **Explicit Search Detection**:
   - Anchored search result detection to explicit paths (/search, /search/), query parameters (?s=, &s=), or explicit titles ("search results", "search").
3. **Dynamic Re-evaluation on Package Extraction**:
   - Package normalization dynamically re-evaluates exclusions upon extraction without relying on stale pre-computed flags baked into previously synced packages.
4. **Zero Regressions on Existing Sites**:
   - Verified across all connected WordPress and Magento sites (Ascent Builders, Bathroom Upgrades, HF4You, Civion, Auto Tech Erith).

---

## 2. Actual Live Classification Breakdown

### The Search Equation (	hesearchequation.com - 113 total pages):
- **Hub**: 1 (https://www.thesearchequation.com/)
- **Landing (Commercial / Services / Local)**: 29
- **Topical (Insights / Indexes)**: 4
- **Article (Blog Posts / Guides)**: 74
- **Excluded (Genuine Non-SEO Utility / Policy)**: 5
  - https://www.thesearchequation.com/sitemap/ (Sitemap)
  - https://www.thesearchequation.com/terms-of-use/ (Terms & Conditions)
  - https://www.thesearchequation.com/privacy-policy/ (Privacy Policy)
  - https://www.thesearchequation.com/about-us/ (About Us)
  - https://www.thesearchequation.com/contact-us/ (Contact Us)
- **Unclassified**: 0

### Regression Verification on Existing Connected Sites:
- **Ascent Builders (62 pages)**: 1 Hub, 43 Landing, 1 Topical, 10 Article, 5 Excluded, 2 Unclassified (100% matched)
- **Bathroom Upgrades (31 pages)**: 1 Hub, 15 Landing, 2 Topical, 7 Article, 6 Excluded (100% matched)
- **HF4You (128 pages)**: 1 Hub, 48 Landing, 63 Topical, 16 Excluded (100% matched)
- **Civion (26 pages)**: 1 Hub, 15 Landing, 6 Article, 4 Excluded (100% matched)
- **Auto Tech Erith (37 pages)**: 1 Hub, 23 Landing, 1 Topical, 8 Article, 4 Excluded (100% matched)

---

## 3. Database State at Snapshot

| Table | Record Count | Description |
|---|---|---|
| websites | 14 | Connected website profiles |
| wp_packages | 6 | Ingested WordPress/Magento packages |
| page_configurations | 200 | Target phrases, types, and priority overrides |
| page_audits | 2 | Live page audit results & fingerprints |
| link_recommendations | 0 | Internal linking recommendations |

