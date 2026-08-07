# Restore Point: v1.1-page-metadata-import

**Git Tag:** `v1.1-page-metadata-import`  
**Date:** `07-08-2026 12:58`  
**Status:** `Current`

---

## Objective & Summary

Complete WordPress page import metadata. Every imported page record is enriched with Page Title, URL, Page Type, and automatic Exclusion rules.

### Included Features:
1. **Page Title**: Actual WordPress page title (falls back to "Untitled Page" only if title is missing).
2. **URL**: Standardized permalink URL.
3. **Page Type**: WordPress object classification (Page, Post, Category, Tag, Author, Archive, Custom Post Type, Attachment, Other).
4. **Automatic Exclusion**: Auto-detects utility/legal pages (Privacy Policy, Terms, Cookie Policy, Cart, Checkout, My Account, Login, Register, Search, Feed URLs, 404, Thank-you, Attachment, Sitemap, RSS/XML) and marks them as `Excluded`. All other pages default to `Included` (ready for classification).
