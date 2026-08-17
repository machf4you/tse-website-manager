# Restore Point: v1.10-w4-cache-invalidation-and-public-verification

**Tag:** `v1.10-w4-cache-invalidation-and-public-verification`  
**Date:** 17-08-2026  
**Status:** **Current**

---

## Summary of Changes

1. **Targeted Cache Invalidation**:
   - Integrated automatic call to `DELETE /wp-json/elementor/v1/cache` in `updateWordPressSEOFields` (`src/services/wordpressApi.js`).
   - Clears Elementor/WordPress in-memory object cache and compiled CSS without requiring manual WordPress intervention or flushing full MySQL database.

2. **Public Frontend HTML Verification**:
   - Performs automated post-write cache-busted fetch against the public page URL.
   - Verifies the rendered public HTML contains the newly written H1 string before returning completion status (`publicVerified: true`).

3. **Ascent Builders Live End-to-End Test**:
   - Confirmed public H1 on `https://www.ascentbuilders.co.uk/` updated from `"Expert Building Services in South London & Surrey"` to `"Expert Building Services in South London & Surrey UK"`.

---

## Verification Strategy

- `npm run build` compiled cleanly.
- End-to-end W4 Push execution verified live public HTML response contains `"Expert Building Services in South London & Surrey UK"`.
- Git commit, tag, and push.
