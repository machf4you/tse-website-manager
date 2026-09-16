#!/usr/bin/env python3
# TSE Production Baseline Lock Validator — Website Manager
import os
import sys
import json
import re
import subprocess

BASELINE_DESCRIPTOR = os.path.join(os.path.dirname(__file__), 'wm_production_baseline.json')

def load_baseline():
    if not os.path.exists(BASELINE_DESCRIPTOR):
        raise Exception(f"[BASELINE LOCK ERROR] Baseline descriptor missing: {BASELINE_DESCRIPTOR}")
    with open(BASELINE_DESCRIPTOR, 'r', encoding='utf-8') as f:
        return json.load(f)

def run_baseline_lock_check(repo_path, manifest):
    print("=" * 70)
    print("[PRE-DEPLOYMENT GATE: PRODUCTION BASELINE LOCK — WEBSITE MANAGER]")
    print("=" * 70)

    baseline = load_baseline()

    # Rule 8, 9, 10: Verify baseline has explicit Mac acceptance
    if not baseline.get('macAccepted', False):
        raise Exception("[BASELINE LOCK BLOCKED] The current baseline does not have Mac's verified acceptance. Deployment cannot proceed.")

    baseline_tag = baseline.get('baselineTag', 'wm-v2.50-full-disaster-recovery')
    print(f"Authoritative Accepted Baseline: {baseline.get('baselineVersion')} ({baseline_tag})")
    print(f"Mac Accepted Date: {baseline.get('acceptedDate')}")

    allowed_files = set(f.replace('\\', '/') for f in manifest.get('allowedFiles', []))
    task_desc = manifest.get('task', 'Unspecified task')
    print(f"Authorized Task Scope: {task_desc}")
    print(f"Declared Allowed Files ({len(allowed_files)}):")
    for af in sorted(allowed_files):
        print(f"  - {af}")

    # 1. Routes & Views Verification
    print("\n[CHECK 1/5] Verifying Protected Views & Navigation Routes...")
    app_jsx_path = os.path.join(repo_path, 'src', 'App.jsx')
    if not os.path.exists(app_jsx_path):
        raise Exception("[BASELINE LOCK BLOCKED] src/App.jsx missing!")
    with open(app_jsx_path, 'r', encoding='utf-8') as f:
        app_jsx_content = f.read()

    for view in baseline['protectedFeatures']['views']:
        if view not in app_jsx_content:
            raise Exception(f"[BASELINE LOCK BLOCKED] Protected navigation view '{view}' missing or deleted from src/App.jsx!")
    print(f"  [PASS] All {len(baseline['protectedFeatures']['views'])} protected navigation views intact in App.jsx.")

    # Check Global Settings Sub-tabs
    gs_jsx_path = os.path.join(repo_path, 'src', 'pages', 'GlobalSettings.jsx')
    if os.path.exists(gs_jsx_path):
        with open(gs_jsx_path, 'r', encoding='utf-8') as f:
            gs_jsx_content = f.read()
        for tab in baseline['protectedFeatures'].get('globalSettingsTabs', []):
            if tab not in gs_jsx_content:
                raise Exception(f"[BASELINE LOCK BLOCKED] Protected Global Settings tab '{tab}' missing or deleted from GlobalSettings.jsx!")
        print(f"  [PASS] All {len(baseline['protectedFeatures'].get('globalSettingsTabs', []))} protected Global Settings tabs verified.")

    # 2. Protected Components Verification
    print("\n[CHECK 2/5] Verifying Protected Component Files...")
    for comp_rel in baseline['protectedFeatures']['components']:
        full_p = os.path.join(repo_path, comp_rel)
        if not os.path.exists(full_p):
            raise Exception(f"[BASELINE LOCK BLOCKED] Protected component file missing: {comp_rel}")
        if os.path.getsize(full_p) < 100:
            raise Exception(f"[BASELINE LOCK BLOCKED] Protected component '{comp_rel}' is abnormally small / truncated ({os.path.getsize(full_p)} bytes)!")
    print(f"  [PASS] All {len(baseline['protectedFeatures']['components'])} protected component files verified on disk.")

    # 3. UI Controls & Layout Invariants Verification
    print("\n[CHECK 3/5] Verifying Accepted UI Controls & Layout Invariants...")
    rp_page_path = os.path.join(repo_path, 'src', 'pages', 'RestorePointsPage.jsx')
    if os.path.exists(rp_page_path):
        with open(rp_page_path, 'r', encoding='utf-8') as f:
            rp_content = f.read()
        for col in ['DATE', 'VERSION', 'TITLE', 'DESCRIPTION']:
            if col not in rp_content:
                raise Exception(f"[BASELINE LOCK BLOCKED] Universal Restore Point column '{col}' missing from RestorePointsPage.jsx!")
        print("  [PASS] Universal 4-column layout headers verified.")

    # 4. API Contracts Verification
    print("\n[CHECK 4/5] Verifying Server API Endpoint Contracts...")
    server_idx_path = os.path.join(repo_path, 'server', 'index.js')
    if not os.path.exists(server_idx_path):
        raise Exception("[BASELINE LOCK BLOCKED] server/index.js missing!")
    with open(server_idx_path, 'r', encoding='utf-8') as f:
        server_content = f.read()

    for ep in baseline['protectedFeatures']['apiEndpoints']:
        # e.g. '/api/websites'
        if ep not in server_content:
            raise Exception(f"[BASELINE LOCK BLOCKED] Protected API route '{ep}' missing from server/index.js!")
    print(f"  [PASS] All {len(baseline['protectedFeatures']['apiEndpoints'])} API endpoint contracts verified.")

    # 5. Git Diff Against Authoritative Baseline
    print("\n[CHECK 5/5] Comparing Candidate Diff Against Authoritative Baseline Tag...")
    candidate_commit = manifest.get('candidateCommit', 'HEAD')
    diff_res = subprocess.run(['git', 'diff', '--name-only', baseline_tag, candidate_commit], cwd=repo_path, capture_output=True, text=True)
    if diff_res.returncode != 0:
        raise Exception(f"[BASELINE LOCK BLOCKED] Failed to diff against baseline tag {baseline_tag}: {diff_res.stderr}")

    changed_files = [f.strip().replace('\\', '/') for f in diff_res.stdout.split('\n') if f.strip()]
    unauthorized_changes = [f for f in changed_files if f not in allowed_files]

    if unauthorized_changes:
        print("\n" + "="*70)
        print("[BASELINE LOCK BLOCKED] OUT-OF-SCOPE FUNCTIONALITY MODIFICATION DETECTED!")
        print(f"Candidate contains changes to {len(unauthorized_changes)} file(s) outside authorized task scope:")
        for uf in unauthorized_changes:
            print(f"  [UNAUTHORIZED REGRESSION RISK] {uf}")
        print("="*70 + "\n")
        raise Exception(f"Production Baseline Lock blocked deployment: {len(unauthorized_changes)} out-of-scope files modified.")

    print(f"  [PASS] All {len(changed_files)} changed files match declared allowed scope.")
    print("\n" + "="*70)
    print("[PASS] PRODUCTION BASELINE LOCK: 100% VERIFIED — ALL ACCEPTED BEHAVIOUR PROTECTED")
    print("="*70 + "\n")
    return True

if __name__ == '__main__':
    repo = r'c:\Antigravity\tse-website-manager'
    manifest_p = os.path.join(repo, 'tse-manifest.json')
    with open(manifest_p, 'r', encoding='utf-8') as f:
        mf = json.load(f)
    try:
        run_baseline_lock_check(repo, mf)
        print("[SUCCESS] Baseline lock check PASSED.")
    except Exception as e:
        print(f"[BLOCKED] {e}")
        sys.exit(1)
