#!/usr/bin/env python3
"""
TSE Universal Automated DR Restore Point Registration Engine
Mechanically records, validates, deduplicates, and synchronizes authoritative
Disaster Recovery restore points across all TSE applications.
"""

import os
import sys
import re
import json
import argparse
from datetime import datetime

# Determine base paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WM_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_JS_PATH = os.path.join(WM_ROOT, 'src', 'data', 'restorePointData.js')
INDEX_MD_PATH = os.path.join(WM_ROOT, 'RESTORE-POINT-INDEX.md')
REGISTRY_JSON_PATH = os.path.join(WM_ROOT, 'server', 'restore_points_registry.json')
VPS_BACKUPS_DIR = '/opt/tse-apps/backups'
VPS_AUTH_JSON = os.path.join(VPS_BACKUPS_DIR, 'authoritative_restore_points.json')
VPS_BACKUP_INDEX_MD = os.path.join(VPS_BACKUPS_DIR, 'BACKUP-INDEX.md')


def load_registry():
    """Load authoritative registry list from JSON file or restorePointData.js."""
    if os.path.exists(REGISTRY_JSON_PATH):
        try:
            with open(REGISTRY_JSON_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[WARN] Failed to read {REGISTRY_JSON_PATH}: {e}")

    if os.path.exists(DATA_JS_PATH):
        try:
            with open(DATA_JS_PATH, 'r', encoding='utf-8') as f:
                c = f.read()
                m = re.search(r'export\s+const\s+restorePointIndexData\s*=\s*(\[[\s\S]*?\]);?', c)
                if m:
                    return json.loads(m.group(1))
        except Exception as e:
            print(f"[WARN] Failed to parse {DATA_JS_PATH}: {e}")

    return []


def save_registry(items):
    """Save authoritative registry to all persistence locations."""
    os.makedirs(os.path.dirname(REGISTRY_JSON_PATH), exist_ok=True)
    
    # 1. Save JSON registry
    with open(REGISTRY_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved registry to {REGISTRY_JSON_PATH}")

    # 2. Save VPS JSON if on VPS
    if os.path.exists(VPS_BACKUPS_DIR):
        try:
            with open(VPS_AUTH_JSON, 'w', encoding='utf-8') as f:
                json.dump(items, f, indent=2, ensure_ascii=False)
            print(f"✅ Saved VPS registry to {VPS_AUTH_JSON}")
        except Exception as e:
            print(f"[WARN] Could not write {VPS_AUTH_JSON}: {e}")

    # 3. Update restorePointData.js
    if os.path.exists(os.path.dirname(DATA_JS_PATH)):
        js_content = "/**\n * Master restore point data representing RESTORE-POINT-INDEX.md.\n * Authoritative single source of truth for the Restore Points manager.\n * AUTOMATICALLY SYNCHRONIZED BY scripts/register_dr_restore_point.py\n */\nexport const restorePointIndexData = " + json.dumps(items, indent=2, ensure_ascii=False) + "\n"
        with open(DATA_JS_PATH, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"✅ Synced {DATA_JS_PATH}")

    # 4. Update RESTORE-POINT-INDEX.md
    if os.path.exists(INDEX_MD_PATH):
        generate_markdown_index(items, INDEX_MD_PATH)


def generate_markdown_index(items, output_path):
    """Generate clean Markdown index table."""
    lines = [
        "# Restore Point Index",
        "",
        "Master index of active restore points for the TSE ecosystem, grouped by application.",
        "",
        "---",
        "",
        "| Section | Version | Git Tag | Commit | Date | Summary | Status |",
        "|---|---|---|---|---|---|---|"
    ]
    for item in items:
        app = item.get('app', '')
        ver = item.get('version', '')
        tag = f"`{item['gitTag']}`" if item.get('gitTag') else "-"
        commit = f"`{item['commit']}`" if item.get('commit') else "`[AUTO]`"
        date = item.get('date', '')
        desc = (item.get('title') or item.get('description', '')).replace('\n', ' ')
        status = "**Current**" if item.get('status') == 'Current' else "Superseded"
        lines.append(f"| {app} | {ver} | {tag} | {commit} | {date} | {desc} | {status} |")

    lines.append("")
    lines.append("---")
    lines.append("")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"✅ Synced {output_path}")


def register_restore_point(app, version, git_tag, commit, date_str, title, description, location=None, verify_backup_path=None):
    # 1. MANDATORY INTEGRITY VERIFICATION (Rule 5 & 6)
    if verify_backup_path:
        if not os.path.exists(verify_backup_path):
            print(f"🛑 [REGISTRATION REJECTED] Specified backup verification path does not exist: {verify_backup_path}")
            sys.exit(1)
        if os.path.isdir(verify_backup_path):
            files = os.listdir(verify_backup_path)
            if not files:
                print(f"🛑 [REGISTRATION REJECTED] Backup directory is empty: {verify_backup_path}")
                sys.exit(1)
        elif os.path.isfile(verify_backup_path):
            if os.path.getsize(verify_backup_path) == 0:
                print(f"🛑 [REGISTRATION REJECTED] Backup file is empty (0 bytes): {verify_backup_path}")
                sys.exit(1)
        print(f"✅ [INTEGRITY CHECK PASSED] Verified backup artifact at {verify_backup_path}")

    if not date_str:
        now = datetime.now()
        date_str = now.strftime('%d-%m-%Y %H:%M')

    slug_app = app.lower().replace(' ', '-')
    slug_ver = version.lower().replace(' ', '-')
    point_id = git_tag if git_tag else f"{slug_app}-{slug_ver}"

    new_entry = {
        "id": point_id,
        "app": app,
        "version": version,
        "gitTag": git_tag,
        "commit": commit,
        "date": date_str,
        "title": title,
        "description": description,
        "location": location or "",
        "status": "Current",
        "docFile": f"RESTORE-POINT-{git_tag}.md" if git_tag else f"RESTORE-POINT-{point_id}.md"
    }

    items = load_registry()

    # 2. DEDUPLICATION (Rule 7)
    existing_idx = None
    for idx, item in enumerate(items):
        if (git_tag and item.get('gitTag') == git_tag) or            (item.get('id') == point_id) or            (item.get('app') == app and item.get('version') == version and item.get('commit') == commit):
            existing_idx = idx
            break

    if existing_idx is not None:
        print(f"ℹ️ [DUPLICATE DETECTED] Updating existing entry for {app} ({version} / {git_tag})")
        items[existing_idx] = new_entry
    else:
        print(f"✨ [NEW ENTRY] Adding restore point for {app} ({version} / {git_tag})")
        for item in items:
            if item.get('app') == app:
                item['status'] = 'Superseded'
        items.insert(0, new_entry)

    # Re-normalize statuses: latest per app is Current, rest Superseded
    seen_apps = set()
    for item in items:
        app_name = item.get('app')
        if app_name not in seen_apps:
            item['status'] = 'Current'
            seen_apps.add(app_name)
        else:
            item['status'] = 'Superseded'

    save_registry(items)
    print(f"🎉 Successfully registered DR restore point: {app} {version} ({git_tag})")
    return new_entry


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="TSE Universal DR Restore Point Registrar")
    parser.add_argument('--app', required=True, help="Application name")
    parser.add_argument('--version', required=True, help="Version string")
    parser.add_argument('--tag', required=True, help="Git DR tag")
    parser.add_argument('--commit', required=True, help="Git commit hash")
    parser.add_argument('--title', required=True, help="Restore point title")
    parser.add_argument('--description', required=True, help="Description")
    parser.add_argument('--date', default=None, help="Date string")
    parser.add_argument('--location', default=None, help="Backup location")
    parser.add_argument('--verify-backup-path', default=None, help="Verification path")

    args = parser.parse_args()
    register_restore_point(
        app=args.app,
        version=args.version,
        git_tag=args.tag,
        commit=args.commit,
        date_str=args.date,
        title=args.title,
        description=args.description,
        location=args.location,
        verify_backup_path=args.verify_backup_path
    )
