#!/usr/bin/env python3
# TSE Baseline Advancement Engine — Website Manager
# Permanent Rule: This script is executed ONLY AFTER Mac gives explicit visual acceptance of a production release.
import os
import sys
import json
import time
import argparse
import subprocess

BASELINE_DESCRIPTOR = os.path.join(os.path.dirname(__file__), 'wm_production_baseline.json')

def advance_baseline(version, tag, commit, date_str=None):
    if not os.path.exists(BASELINE_DESCRIPTOR):
        raise Exception(f"Baseline descriptor missing: {BASELINE_DESCRIPTOR}")

    with open(BASELINE_DESCRIPTOR, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not date_str:
        date_str = time.strftime('%d %b %Y').upper()

    print("=" * 70)
    print("ADVANCING AUTHORITATIVE PRODUCTION BASELINE (MAC ACCEPTED)")
    print("=" * 70)
    print(f"Previous Baseline: {data.get('baselineVersion')} ({data.get('baselineTag')})")
    print(f"New Baseline:      {version} ({tag}) @ Commit {commit[:8]}")
    print(f"Accepted Date:     {date_str}")
    print("=" * 70)

    data['baselineVersion'] = version
    data['baselineTag'] = tag
    data['baselineCommit'] = commit
    data['acceptedDate'] = date_str
    data['macAccepted'] = True
    data['macAcceptedTimestamp'] = int(time.time() * 1000)

    with open(BASELINE_DESCRIPTOR, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print("[SUCCESS] Production baseline successfully advanced and locked.")
    print("All future candidate deployments will be validated against this baseline.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Advance TSE Website Manager Production Baseline")
    parser.add_argument('--version', required=True, help="e.g. v2.50-wm-stable")
    parser.add_argument('--tag', required=True, help="e.g. wm-v2.50-full-disaster-recovery")
    parser.add_argument('--commit', required=True, help="e.g. 1d7741a4")
    parser.add_argument('--date', required=False, help="e.g. 16 SEP 2026")
    args = parser.parse_args()

    advance_baseline(args.version, args.tag, args.commit, args.date)
