#!/usr/bin/env python3
# TSE Automated Restore Point Synchronization Engine
import os
import re
import json
import subprocess
from datetime import datetime

TSE_REPOS = [
    ('TSE Website Manager', r'c:\Antigravity\tse-website-manager'),
    ('TSE Site Registry', r'c:\Antigravity\tse-site-registry'),
    ('TSE Keyword Research', r'c:\Antigravity\tse-keyword-research'),
    ('TSE Lead Generator', r'c:\Antigravity\Lead Gen'),
    ('TSE Page Auditor', r'c:\Antigravity\tse-page-auditor'),
    ('TSE Chatza', r'c:\Antigravity\Chatza')
]

TARGET_JS = r'c:\Antigravity\tse-website-manager\src\data\restorePointData.js'
TARGET_MD = r'c:\Antigravity\tse-website-manager\RESTORE-POINT-INDEX.md'

EXPLICIT_MILESTONES = [
    {
        'id': 'sr-v2.19-accepted-production',
        'version': 'v2.19-sr-accepted',
        'gitTag': 'sr-v2.19-accepted',
        'commit': 'cc1566d',
        'date': '16-09-2026 10:15',
        'title': 'TSE Site Registry V2.19 Production Accepted & Domains Restoration',
        'description': 'Confirmed production accepted baseline for TSE Site Registry: 3-item restoration (Sortable domain table columns, Domain Details edit dialog persistence, and Auto-Renew unknown normalization to No/False), softer dashboard outline styling, medium headline typography, and Awaiting Indexing / Articles module.',
        'status': 'Current',
        'docFile': 'V2.19-STABLE-INDEXCHECKER-RECONCILIATION-NORMALIZATION.md',
        'purpose': 'Production accepted baseline for Site Registry with restored domain sorting, editing, and accurate auto-renew status.',
        'verifiedWorking': [
            'Sortable domain table columns (ascending, descending, active indicator)',
            'Edit Domain dialog across sections with database save',
            'Auto-Renew unknown normalized to NO / false with clean UI badges',
            'Dashboard softer outlines and medium font weights',
            'Articles navigation and CSV exports'
        ],
        'filesChanged': [
            'src/pages/DomainsPage.tsx',
            'src/components/EditDomainDialog.tsx',
            'src/components/DashboardMetrics.tsx',
            'src/components/AttentionRequired.tsx',
            'src/components/PortfolioOverview.tsx'
        ]
    },
    {
        'id': 'wm-v2.43-baseline',
        'version': 'v2.43-wm-stable',
        'gitTag': 'wm-v2.43-baseline',
        'commit': '2b4274f',
        'date': '15-09-2026 11:59',
        'title': 'TSE Website Manager V2.43 Users & Access Management Baseline',
        'description': 'Confirmed stable baseline V2.43: globally suppressed browser address and credential autofill in modals, fixed password retrieval and show/hide functionality, verified Edit User modal footer visibility, and updated build versioning.',
        'status': 'Superseded',
        'docFile': 'RESTORE-POINT-v2.21-stable-classification-engine-hostname-isolation-fix.md',
        'purpose': 'Suppress browser address and credential autofill in modals, resolve password editing issues in Users & Access.',
        'verifiedWorking': [
            'Global autofill suppression across all application modals',
            'Password Show/Hide toggle and reliable hash persistence',
            'Edit User modal footer and Save button scrolling fixes',
            'Multi-user live synchronization'
        ],
        'filesChanged': [
            'src/pages/UsersAccessPage.jsx',
            'src/components/EditUserDialog.jsx',
            'server/index.js'
        ]
    },
    {
        'id': 'leadgen-v1.42-stable-prior-to-user-workspace-separation',
        'version': 'v1.42-lg-stable',
        'gitTag': 'V1.42-STABLE-PRIOR-TO-USER-WORKSPACE-SEPARATION',
        'commit': '1863136',
        'date': '15-09-2026 12:32',
        'title': 'TSE Lead Generator V1.42 Stable Baseline',
        'description': 'Confirmed stable release V1.42 capturing Master Email Templates management, personalisations variables panel, 70+ opportunity score highlighting, single template creation bar, website desktop preview, and full outreach pack workflow.',
        'status': 'Superseded',
        'docFile': 'RESTORE-POINT-V1.42-STABLE-PRIOR-TO-USER-WORKSPACE-SEPARATION.md',
        'purpose': 'Master email templates management, score 70+ highlights, and outreach pack workflow.',
        'verifiedWorking': [
            'Master email templates editor with personalisations variables',
            'Opportunity Score 70+ green highlight',
            'Website desktop preview modal',
            'Outreach packs and email discovery integration'
        ],
        'filesChanged': [
            'src/pages/MasterTemplatesPage.jsx',
            'src/pages/SearchResultsPage.jsx',
            'src/components/WebsitePreviewModal.jsx'
        ]
    },
    {
        'id': 'wm-v2.24-stable-w5-contextual-sentence-generator',
        'version': 'v2.24-wm-stable',
        'gitTag': 'v2.24-stable-w5-contextual-sentence-and-internal-linking-suite',
        'commit': 'fdb459e',
        'date': '13-09-2026 12:46',
        'title': 'TSE Website Manager V2.24 W5 Internal Linking Engine & 11-Stage Workflow',
        'description': 'Confirmed stable release V2.24: real 11-stage connected TSE website workflow journey on homepage, W5 in-place editorial block updates with Elementor _elementor_data push pipeline, natural anchor text generation with contextual AI sentence synthesis, and unique body-content internal link counts.',
        'status': 'Superseded',
        'docFile': 'RESTORE-POINT-v2.20-realtime-multi-user-website-manager.md',
        'purpose': '11-stage TSE workflow visualization, W5 internal linking with in-place editorial updates and AI sentence generation.',
        'verifiedWorking': [
            'Unified HOW TSE WORKS 11-stage connected journey',
            'In-place editorial block replacement without blind appending',
            'Elementor _elementor_data push pipeline & verification',
            'Unique body-content internal link counts'
        ],
        'filesChanged': [
            'src/pages/HomePage.jsx',
            'src/pages/InternalLinkingPage.jsx',
            'src/services/wordpressApi.js'
        ]
    },
    {
        'id': 'kr-v1.4.5-iframe-form-submission-fix',
        'version': 'v1.4.5-kr-stable',
        'gitTag': 'v1.4.5-iframe-form-submission-fix',
        'commit': '4253174',
        'date': '12-09-2026 11:42',
        'title': 'TSE Keyword Research V1.4.5 Central Forms API & Static Generator',
        'description': 'Central TSE Forms API integration with server-side notification routing, responsive static enquiry form generation, and allow-forms iframe preview support.',
        'status': 'Superseded',
        'docFile': 'RESTORE-POINT-v1.4.3-stable-end-to-end-static-website-build-confirmed.md',
        'purpose': 'Forms API submission in preview iframe, static enquiry form generation.',
        'verifiedWorking': [
            'Allow-forms sandbox permission in live preview',
            'Central forms API endpoint routing',
            'International telephone and postcode validation',
            'Gallery stock photography rendering'
        ],
        'filesChanged': [
            'src/components/SiteBuilder.jsx',
            'server/index.js'
        ]
    },
    {
        'id': 'kr-v1.4.3-stable-end-to-end-static-website-build-confirmed',
        'version': 'v1.4.3-kr-stable',
        'gitTag': 'v1.4.3-stable-end-to-end-static-website-build-confirmed',
        'commit': 'c8c4b86',
        'date': '12-09-2026 11:00',
        'title': 'TSE Keyword Research & Static Website Generator Engine (V1.4.3)',
        'description': 'Confirmed stable end-to-end Keyword Research to Static Website Generator build: approved 4-page hierarchy, approved content copy, Premium + Warm Contemporary design, royalty-free stock photography, 7-file static package (HTML/CSS/sitemap/robots), server persistence in Supabase, and full-width preview layout.',
        'status': 'Superseded',
        'docFile': 'RESTORE-POINT-v1.4.3-stable-end-to-end-static-website-build-confirmed.md',
        'purpose': 'End-to-end Keyword Research to Static Website Generator build.',
        'verifiedWorking': [
            'Approved 4-page hierarchy and content generation',
            'Premium + Warm Contemporary design system',
            'Royalty-free stock photo integration',
            'Full-width preview layout'
        ],
        'filesChanged': [
            'src/components/SiteBuilder.jsx',
            'src/components/KeywordResearchView.jsx'
        ]
    }
]

def parse_date_sort_key(date_str):
    if not date_str:
        return '1970-01-01 00:00'
    m = re.search(r'(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(\d{2}):(\d{2}))?', date_str)
    if m:
        day, month, year = m.group(1), m.group(2), m.group(3)
        hour = m.group(4) or '00'
        minute = m.group(5) or '00'
        return f"{year}-{month}-{day} {hour}:{minute}"
    m = re.search(r'(\d{4})[-/](\d{2})[-/](\d{2})', date_str)
    if m:
        year, month, day = m.group(1), m.group(2), m.group(3)
        return f"{year}-{month}-{day} 00:00"
    try:
        dt = datetime.strptime(date_str.replace(',', '').strip(), '%B %d %Y')
        return dt.strftime('%Y-%m-%d 00:00')
    except Exception:
        pass
    return date_str

def extract_from_md(app_label, filename, fullpath):
    with open(fullpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else filename.replace('.md', '')
    title = re.sub(r'^(RESTORE POINT:\s*|TSE Site Registry\s*[—–-]\s*)', '', title, flags=re.IGNORECASE)

    version_match = re.search(r'\*\*Version\*\*:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)
    if not version_match:
        version_match = re.search(r'Version:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)

    date_match = re.search(r'\*\*Date\*\*:\s*([^\r\n]+)', content, re.IGNORECASE)
    if not date_match:
        date_match = re.search(r'Date:\s*([^\r\n]+)', content, re.IGNORECASE)

    tag_match = re.search(r'\*\*Git Tag\*\*:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)
    if not tag_match:
        tag_match = re.search(r'Git Tag:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)

    commit_match = re.search(r'\*\*Commit\*\*:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)
    if not commit_match:
        commit_match = re.search(r'Commit:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)

    desc = ""
    desc_match = re.search(r'## (?:Executive )?Summary\s*\n\n([^\n#]+)', content)
    if desc_match:
        desc = desc_match.group(1).strip()
    else:
        lines = [l.strip() for l in content.split('\n') if l.strip() and not l.startswith('#') and not l.startswith('**') and not l.startswith('|') and not l.startswith('---')]
        if lines:
            desc = lines[0]
            if desc.startswith('- '):
                desc = desc[2:].strip()

    version = version_match.group(1).strip() if version_match else ''
    version = re.sub(r'^\*\*\s*', '', version).strip()
    if not version:
        vm = re.search(r'(v\d+\.\d+(?:\.\d+)?(?:-[a-z0-9-]+)?)', filename, re.IGNORECASE)
        version = vm.group(1).lower() if vm else 'v1.0'

    raw_date = date_match.group(1).strip() if date_match else ''
    raw_date = re.sub(r'^\*\*\s*', '', raw_date).strip()
    if not raw_date:
        mtime = os.path.getmtime(fullpath)
        raw_date = datetime.fromtimestamp(mtime).strftime('%d-%m-%Y %H:%M')

    gitTag = tag_match.group(1).strip() if tag_match else filename.replace('.md', '').lower().replace('restore-point-', '')
    gitTag = re.sub(r'^\*\*\s*', '', gitTag).strip()

    commit = commit_match.group(1).strip() if commit_match else '[AUTO]'
    commit = re.sub(r'^\*\*\s*', '', commit).strip()

    base_id = filename.replace('.md', '').lower()
    if base_id.startswith('restore-point-'):
        base_id = base_id[14:]

    return {
        'id': base_id,
        'version': version,
        'gitTag': gitTag,
        'commit': commit if commit else '[AUTO]',
        'date': raw_date,
        'title': f"{title}",
        'description': desc[:350] if desc else f"Confirmed stable restore point for {title}.",
        'status': 'Superseded',
        'docFile': filename
    }

def collect_all_restore_points():
    combined = list(EXPLICIT_MILESTONES)
    seen_ids = set(item['id'] for item in combined)
    seen_docs = set(item['docFile'] for item in combined if item.get('docFile'))

    for app_label, repo_path in TSE_REPOS:
        if not os.path.exists(repo_path):
            continue
        for root, dirs, files in os.walk(repo_path):
            if any(ign in root for ign in ['node_modules', '.git', 'dist', '.venv', 'ARCHIVE']):
                continue
            for f in files:
                if f.endswith('.md') and any(f.lower().startswith(p) for p in ['restore-point-', 'v1.', 'v2.', 'v3.', 'sr-v', 'wm-v']):
                    if f.upper() in ['RESTORE-POINT-INDEX.MD']:
                        continue
                    full = os.path.join(root, f)
                    try:
                        rp = extract_from_md(app_label, f, full)
                        if rp['id'] not in seen_ids and rp['docFile'] not in seen_docs:
                            if app_label != 'TSE Website Manager' and not rp['title'].startswith('TSE'):
                                rp['title'] = f"{app_label} — {rp['title']}"
                            combined.append(rp)
                            seen_ids.add(rp['id'])
                            seen_docs.add(rp['docFile'])
                    except Exception as e:
                        print(f"Error parsing {full}: {e}")

    combined.sort(key=lambda x: parse_date_sort_key(x.get('date', '')), reverse=True)

    for idx, item in enumerate(combined):
        item['status'] = 'Current' if idx == 0 else 'Superseded'

    return combined

def sync_restore_points():
    print("============================================================")
    print("[RESTORE POINT SYNCHRONIZER] Scanning all TSE workspaces...")
    print("============================================================")

    restore_points = collect_all_restore_points()
    print(f"Found and indexed {len(restore_points)} restore points.")

    js_content = "/**\n * Master restore point data representing RESTORE-POINT-INDEX.md.\n * Authoritative single source of truth for the Restore Points manager.\n * AUTOMATICALLY GENERATED BY scripts/sync_restore_points.py\n */\nexport const restorePointIndexData = "
    js_content += json.dumps(restore_points, indent=2)
    js_content += ";\n"

    with open(TARGET_JS, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print(f"[UPDATED] {TARGET_JS}")

    md_lines = [
        "# Restore Point Index",
        "",
        "Master index of all restore points for the TSE ecosystem.",
        "AUTOMATICALLY SYNCHRONIZED by `scripts/sync_restore_points.py` during deployment & snapshot creation.",
        "",
        "---",
        "",
        "| Version | Git Tag | Commit | Date | Summary | Status |",
        "|---|---|---|---|---|---|"
    ]

    for rp in restore_points:
        v = rp.get('version', '')
        t = f"`{rp.get('gitTag', '')}`" if rp.get('gitTag') else '-'
        c = f"`{rp.get('commit', '')}`" if rp.get('commit') else '-'
        d = rp.get('date', '')
        s = rp.get('description', '').replace('|', '\\|')
        st = f"**{rp.get('status', 'Superseded')}**" if rp.get('status') == 'Current' else rp.get('status', 'Superseded')
        md_lines.append(f"| {v} | {t} | {c} | {d} | {s} | {st} |")

    md_lines.append("")
    md_lines.append("---")
    md_lines.append("")

    with open(TARGET_MD, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md_lines))
    print(f"[UPDATED] {TARGET_MD}")
    print("[PASS] Restore point synchronization complete.")

if __name__ == '__main__':
    sync_restore_points()
