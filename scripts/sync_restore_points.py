#!/usr/bin/env python3
# TSE Automated Restore Point Synchronization & Categorisation Engine
import os
import re
import json
import subprocess
from datetime import datetime, timedelta

# Reference time is current system time (2026-09-16)
CURRENT_TIME = datetime(2026, 9, 16, 10, 25, 21)
RETENTION_DAYS = 7
CUTOFF_DATE = (CURRENT_TIME - timedelta(days=RETENTION_DAYS)).date()

TSE_REPOS = [
    ('Website Manager', r'c:\Antigravity\tse-website-manager'),
    ('Site Registry', r'c:\Antigravity\tse-site-registry'),
    ('Keyword Research', r'c:\Antigravity\tse-keyword-research'),
    ('Lead Generator', r'c:\Antigravity\Lead Gen'),
    ('Page Auditor', r'c:\Antigravity\tse-page-auditor'),
    ('Chatza', r'c:\Antigravity\Chatza')
]

TARGET_JS = r'c:\Antigravity\tse-website-manager\src\data\restorePointData.js'
TARGET_MD = r'c:\Antigravity\tse-website-manager\RESTORE-POINT-INDEX.md'

# Only the 3 official application sections; any other is marked Uncategorised
VALID_APPS = {'Website Manager', 'Lead Generator', 'Site Registry'}

EXPLICIT_MILESTONES = [
    {
        'id': 'sr-v2.19-accepted-production',
        'app': 'Site Registry',
        'version': 'v2.19-sr-accepted',
        'gitTag': 'sr-v2.19-accepted',
        'commit': 'cc1566d',
        'date': '16-09-2026 10:15',
        'title': 'Site Registry V2.19 Production Accepted & Domains Restoration',
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
        'app': 'Website Manager',
        'version': 'v2.43-wm-stable',
        'gitTag': 'wm-v2.43-baseline',
        'commit': '2b4274f',
        'date': '15-09-2026 11:59',
        'title': 'Website Manager V2.43 Users & Access Management Baseline',
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
        'app': 'Lead Generator',
        'version': 'v1.42-lg-stable',
        'gitTag': 'V1.42-STABLE-PRIOR-TO-USER-WORKSPACE-SEPARATION',
        'commit': '1863136',
        'date': '15-09-2026 12:32',
        'title': 'Lead Generator V1.42 Stable Baseline',
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
        'app': 'Website Manager',
        'version': 'v2.24-wm-stable',
        'gitTag': 'v2.24-stable-w5-contextual-sentence-and-internal-linking-suite',
        'commit': 'fdb459e',
        'date': '13-09-2026 12:46',
        'title': 'Website Manager V2.24 W5 Internal Linking Engine & 11-Stage Workflow',
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
        'app': 'Uncategorised',
        'version': 'v1.4.5-kr-stable',
        'gitTag': 'v1.4.5-iframe-form-submission-fix',
        'commit': '4253174',
        'date': '12-09-2026 11:42',
        'title': 'Keyword Research V1.4.5 Central Forms API & Static Generator',
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
        'app': 'Uncategorised',
        'version': 'v1.4.3-kr-stable',
        'gitTag': 'v1.4.3-stable-end-to-end-static-website-build-confirmed',
        'commit': 'c8c4b86',
        'date': '12-09-2026 11:00',
        'title': 'Keyword Research & Static Website Generator Engine (V1.4.3)',
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

def determine_app_category(app_label, filename, content):
    content_lower = content.lower()
    fn_lower = filename.lower()

    if app_label == 'Website Manager' or 'website manager' in content_lower or 'website-manager' in fn_lower:
        return 'Website Manager'
    if app_label == 'Lead Generator' or 'lead generator' in content_lower or 'lead-gen' in fn_lower or 'lead gen' in content_lower:
        return 'Lead Generator'
    if app_label == 'Site Registry' or 'site registry' in content_lower or 'site-registry' in fn_lower or 'backlink' in content_lower:
        return 'Site Registry'
    return 'Uncategorised'

def parse_date_to_datetime(raw_str, fullpath=None):
    if not raw_str and fullpath and os.path.exists(fullpath):
        mtime = os.path.getmtime(fullpath)
        return datetime.fromtimestamp(mtime)
    if not raw_str:
        return datetime(1970, 1, 1)

    clean = re.sub(r'^\*\*\s*', '', raw_str).replace('`', '').strip()
    m = re.search(r'(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(\d{2}):(\d{2}))?', clean)
    if m:
        day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        hour = int(m.group(4) or 0)
        minute = int(m.group(5) or 0)
        return datetime(year, month, day, hour, minute)

    m = re.search(r'(\d{4})[-/](\d{2})[-/](\d{2})(?:\s+(\d{2}):(\d{2}))?', clean)
    if m:
        year, month, day = int(m.group(1)), int(m.group(2)), int(m.group(3))
        hour = int(m.group(4) or 0)
        minute = int(m.group(5) or 0)
        return datetime(year, month, day, hour, minute)

    try:
        return datetime.strptime(clean.replace(',', '').strip(), '%d %B %Y')
    except Exception:
        pass

    try:
        return datetime.strptime(clean.replace(',', '').strip(), '%B %d %Y')
    except Exception:
        pass

    if fullpath and os.path.exists(fullpath):
        mtime = os.path.getmtime(fullpath)
        return datetime.fromtimestamp(mtime)

    return datetime(1970, 1, 1)

def extract_from_md(app_label, filename, fullpath):
    with open(fullpath, 'r', encoding='utf-8-sig', errors='ignore') as f:
        content = f.read()

    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else filename.replace('.md', '')
    title = re.sub(r'^(RESTORE POINT:\s*|TSE Site Registry\s*[—–-]\s*)', '', title, flags=re.IGNORECASE)

    version_match = re.search(r'\*\*Version\*\*:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)
    if not version_match:
        version_match = re.search(r'Version:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)

    date_match = re.search(r'\*\*(?:Timestamp|Date)\*\*:\s*([^\r\n]+)', content, re.IGNORECASE)
    if not date_match:
        date_match = re.search(r'(?:Timestamp|Date):\s*([^\r\n]+)', content, re.IGNORECASE)

    tag_match = re.search(r'\*\*Git Tag\*\*:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)
    if not tag_match:
        tag_match = re.search(r'Git Tag:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)

    commit_match = re.search(r'\*\*(?:Commit|Baseline Commit|Canonical Commit)\*\*:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)
    if not commit_match:
        commit_match = re.search(r'(?:Commit|Baseline Commit|Canonical Commit):\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)

    status_match = re.search(r'\*\*Status\*\*:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)
    if not status_match:
        status_match = re.search(r'Status:\s*`?([^`\r\n]+)`?', content, re.IGNORECASE)

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
    raw_date = re.sub(r'^\*\*\s*', '', raw_date).replace('`', '').strip()
    dt = parse_date_to_datetime(raw_date, fullpath)
    formatted_date = dt.strftime('%d-%m-%Y %H:%M') if dt.hour or dt.minute else dt.strftime('%d-%m-%Y')

    gitTag = tag_match.group(1).strip() if tag_match else filename.replace('.md', '').lower().replace('restore-point-', '')
    gitTag = re.sub(r'^\*\*\s*', '', gitTag).replace('`', '').strip()

    commit = commit_match.group(1).strip() if commit_match else '[AUTO]'
    commit = re.sub(r'^\*\*\s*', '', commit).replace('`', '').strip()

    base_id = filename.replace('.md', '').lower()
    if base_id.startswith('restore-point-'):
        base_id = base_id[14:]

    app = determine_app_category(app_label, filename, content)

    return {
        'id': base_id,
        'app': app,
        'version': version,
        'gitTag': gitTag,
        'commit': commit if commit else '[AUTO]',
        'date': formatted_date,
        'parsed_dt': dt,
        'title': f"{title}",
        'description': desc[:350] if desc else f"Confirmed stable restore point for {title}.",
        'status': 'Superseded',
        'docFile': filename
    }

def collect_retained_restore_points():
    combined = []
    seen_ids = set()
    seen_docs = set()

    for item in EXPLICIT_MILESTONES:
        dt = parse_date_to_datetime(item.get('date', ''))
        if dt.date() >= CUTOFF_DATE:
            entry = dict(item)
            entry['parsed_dt'] = dt
            combined.append(entry)
            seen_ids.add(entry['id'])
            seen_docs.add(entry['docFile'])

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
                        if rp['parsed_dt'].date() >= CUTOFF_DATE:
                            if rp['id'] not in seen_ids and rp['docFile'] not in seen_docs:
                                combined.append(rp)
                                seen_ids.add(rp['id'])
                                seen_docs.add(rp['docFile'])
                    except Exception as e:
                        print(f"Error parsing {full}: {e}")

    combined.sort(key=lambda x: x['parsed_dt'], reverse=True)

    for idx, item in enumerate(combined):
        item['status'] = 'Current' if idx == 0 else 'Superseded'
        if 'parsed_dt' in item:
            del item['parsed_dt']

    return combined

def sync_restore_points():
    print("============================================================")
    print(f"[RESTORE POINT CATEGORISATION] Categorising restore points into 3 application sections...")
    print("============================================================")

    retained = collect_retained_restore_points()
    print(f"Total active restore points: {len(retained)}")

    js_content = "/**\n * Master restore point data representing RESTORE-POINT-INDEX.md.\n * Authoritative single source of truth for the Restore Points manager.\n * AUTOMATICALLY GENERATED BY scripts/sync_restore_points.py\n */\nexport const restorePointIndexData = "
    js_content += json.dumps(retained, indent=2)
    js_content += ";\n"

    with open(TARGET_JS, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print(f"[UPDATED] {TARGET_JS}")

    md_lines = [
        "# Restore Point Index",
        "",
        "Master index of active restore points for the TSE ecosystem, grouped by application.",
        "",
        "---",
        "",
        "| Section | Version | Git Tag | Commit | Date | Summary | Status |",
        "|---|---|---|---|---|---|---|"
    ]

    for rp in retained:
        sec = rp.get('app', 'Uncategorised')
        v = rp.get('version', '')
        t = f"`{rp.get('gitTag', '')}`" if rp.get('gitTag') else '-'
        c = f"`{rp.get('commit', '')}`" if rp.get('commit') else '-'
        d = rp.get('date', '')
        s = rp.get('description', '').replace('|', '\\|')
        st = f"**{rp.get('status', 'Superseded')}**" if rp.get('status') == 'Current' else rp.get('status', 'Superseded')
        md_lines.append(f"| {sec} | {v} | {t} | {c} | {d} | {s} | {st} |")

    md_lines.append("")
    md_lines.append("---")
    md_lines.append("")

    with open(TARGET_MD, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md_lines))
    print(f"[UPDATED] {TARGET_MD}")
    print("[PASS] Categorisation and synchronization complete.")
    return retained

if __name__ == '__main__':
    sync_restore_points()
