# RESTORE POINT: Confirmed Apps Dashboard Hierarchy (V2.11)

- **Restore Point Identifier**: `V2.11-STABLE-APPS-DASHBOARD-HIERARCHY-CONFIRMED`
- **Git Tag**: `v2.11-stable-apps-dashboard-hierarchy-confirmed`
- **Build Version**: `V2.11 | READY` (Build Hash: `launchborder211`)
- **Date**: 03-09-2026 18:18
- **Author**: Antigravity Assistant
- **Status**: Live Confirmed & Accepted by Mac

---

## 1. Context & Purpose

This stable restore point captures the live-accepted production state of the **TSE Apps Platform Dashboard**, establishing the true operational hierarchy between the core Website Management Suite and standalone marketing/communication applications.

---

## 2. Confirmed State & Components

### A. TSE Apps Platform Dashboard
- Restored top-level app launcher and dashboard as the home view.
- Bi-directional navigation: Apps Dashboard $\rightarrow$ Launch Website Manager $\rightarrow$ Back to Apps.
- Zero reliance on browser `localStorage` for application routing state.
- Distinct faint grey card outlines and refined 1340px desktop layout with responsive collapse.

### B. Website Management Suite (Parent & Subordinates)
- **Website Management (Parent)**: Primary suite application card with direct launch into W1 Connected Websites (`https://tse-website-manager.thesearchequation.co.uk/`).
- **Visual Tree Connectors**: Clean CSS tree stems and horizontal crossbars connecting the parent to its supporting engines.
- **Page Auditor (Subordinate Engine)**: Subordinate card explicitly marked as integrated into Website Manager (W4) for single-page audit workflows.
- **Site Auditor (Subordinate Engine)**: Subordinate card marked as in development for site-wide structure auditing.

### C. Independent Standalone Applications
- **Lead Generator**: Independent row with verified live URL (`https://lead-gen.thesearchequation.co.uk/`) and active launch action.
- **Chatza**: Independent row with verified live URL (`https://meet.chatza.app/`) and active launch action.
- **Social Automation**: Independent row with verified live URL (`https://automation.thesearchequation.co.uk/`) and active launch action.
- **WP Exporter**: Independent row utility marked as coming soon.

### D. Protected Core Functionality
- **Website Manager Modules**: W1 Connected Websites, W2 Dashboard, W3 Manage Pages, W4 Fix Issue / Single Page Auditor, and Global Settings remain 100% operational.
- **HF4You Magento Category Hierarchy**: Full category tree, 122 SEO-managed pages, and visual Shop By separators intact.
- **Ascent Builders V2.02 Prototype**: URL-derived hierarchy with 23 location pages beneath `Areas We Cover` and standalone `Loft Conversions Surrey` service row intact.
- **Global Phrase Matching**: Deterministic minimum-token-window proximity matcher aligned across backend (`scorer.py`) and frontend (`phraseMatcher.js`).
- **Database & Site Data**: Zero modifications to stored SQLite configurations, target phrases, priorities, ⭐ work flags, or live site content.
