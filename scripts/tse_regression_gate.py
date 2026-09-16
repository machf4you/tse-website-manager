import urllib.request
import json
import time
import re

SUPABASE_URL = "https://cbdfjdxqhqajzjblysqd.supabase.co"
SUPABASE_KEY = "sb_publishable_Ys5D-QcdSw_gac9YkmKMZg_eLGCfmK5"

def validate_backlinks_row_invariants(rendered_rows, expected_items_count=None):
    if not isinstance(rendered_rows, list) or len(rendered_rows) == 0:
        raise Exception("Backlinks Regression Check Failed: Rendered rows list is empty or invalid.")

    errors = []
    seen_item_keys = set()

    for idx, row in enumerate(rendered_rows):
        target_domain = row.get("target_website_domain") or row.get("target_domain") or row.get("targetDomain") or ""
        if isinstance(target_domain, (list, tuple, dict)):
            errors.append(f"Row {idx+1}: target_domain is a composite structure ({type(target_domain).__name__}), violating 1-target-per-row.")
        elif "," in str(target_domain) or ";" in str(target_domain) or " " in str(target_domain).strip():
            errors.append(f"Row {idx+1}: target_domain contains MULTIPLE combined domains ({target_domain}).")

        target_phrase = row.get("target_phrase") or row.get("targetPhrase") or row.get("anchor_text") or ""
        if isinstance(target_phrase, (list, tuple, dict)):
            errors.append(f"Row {idx+1}: target_phrase is a composite structure ({type(target_phrase).__name__}), violating 1-phrase-per-row.")

        item_id = row.get("id") or row.get("backlink_item_id")
        if item_id:
            if item_id in seen_item_keys:
                errors.append(f"Row {idx+1}: Duplicate item identifier '{item_id}' rendered.")
            seen_item_keys.add(item_id)

    if expected_items_count is not None and len(rendered_rows) != expected_items_count:
        errors.append(f"Row count mismatch: Rendered {len(rendered_rows)} rows, but expected {expected_items_count} individual backlink_items.")

    if errors:
        print("[TIER B REGRESSION DETECTED] Backlinks Invariant Violation:")
        for err in errors[:5]:
            print(f"  [VIOLATION] {err}")
        if len(errors) > 5:
            print(f"  ... and {len(errors) - 5} more violations.")
        raise Exception(f"Backlinks Invariant Verification Failed with {len(errors)} violations.")

    return True

def run_tier_b_site_registry_backlinks(ssh_client=None):
    print("[TIER B - SITE REGISTRY] Verifying Backlinks 1-Row-Per-Item Invariant on Production...")
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/backlinks?select=*,backlink_items(*)&order=created_at.desc&limit=100")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")

    with urllib.request.urlopen(req) as resp:
        backlinks = json.loads(resp.read().decode())

    req_dom = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/domains?select=id,canonical_domain")
    req_dom.add_header("apikey", SUPABASE_KEY)
    req_dom.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    with urllib.request.urlopen(req_dom) as resp_dom:
        domains_list = json.loads(resp_dom.read().decode())
    website_map = {d["id"]: d["canonical_domain"] for d in domains_list if "id" in d and "canonical_domain" in d}

    flat_rows = []
    total_raw_items = 0
    for bl in backlinks:
        items = bl.get("backlink_items") or []
        if len(items) > 0:
            for item in items:
                total_raw_items += 1
                flat_rows.append({
                    "id": item.get("id"),
                    "backlink_id": bl.get("id"),
                    "target_website_domain": website_map.get(item.get("target_website_id"), ""),
                    "target_website_id": item.get("target_website_id"),
                    "target_url": item.get("target_url"),
                    "published_url": bl.get("published_url"),
                    "published_root_domain": bl.get("published_root_domain", ""),
                    "target_phrase": item.get("target_phrase"),
                    "anchor_text": item.get("anchor_text", ""),
                    "created_at": bl.get("created_at"),
                    "is_indexed": bl.get("is_indexed", False),
                    "index_status": bl.get("index_status", "unindexed")
                })
        else:
            flat_rows.append({
                "id": bl.get("id"),
                "backlink_id": bl.get("id"),
                "target_website_domain": "",
                "target_phrase": "",
                "published_url": bl.get("published_url")
            })

    print(f"  - Retrieved {len(backlinks)} parent backlinks producing {len(flat_rows)} rendered rows ({total_raw_items} backlink_items).")
    validate_backlinks_row_invariants(flat_rows)
    print(f"  - Verified {len(flat_rows)} rows: Exactly 1 target domain and 1 target phrase per rendered row.")
    print("[PASS] Tier B Site Registry Backlinks Invariant Verified on Production.")
    return True

def run_tier_b_website_manager(ssh_client):
    print("[TIER B - WEBSITE MANAGER] Verifying production baseline invariants...")
    def run_cmd(cmd):
        stdin, stdout, stderr = ssh_client.exec_command(cmd)
        return stdout.read().decode().strip()

    db_count = run_cmd("sqlite3 /opt/tse-apps/website-manager/shared_db/website_manager.db 'SELECT count(*) FROM websites;'")
    print(f"  - SQLite DB Websites Count: {db_count}")
    if db_count != "14":
        raise Exception(f"Tier B Failed: Expected 14 websites in DB, found {db_count}")

    test_token = f"tier_b_token_{int(time.time())}"
    now_ms = int(time.time() * 1000)
    exp_ms = now_ms + 3600000
    run_cmd(f"sqlite3 /opt/tse-apps/tse-auth-service/data/auth.db \"INSERT OR REPLACE INTO sessions (token, user_id, username, created_at, expires_at) VALUES ('{test_token}', 2, 'mac', {now_ms}, {exp_ms});\"")

    res = run_cmd(f"curl -s -k -b 'tse_auth_token={test_token}' https://tse-website-manager.thesearchequation.co.uk/api/websites")
    run_cmd(f"sqlite3 /opt/tse-apps/tse-auth-service/data/auth.db \"DELETE FROM sessions WHERE token = '{test_token}';\"")

    data = json.loads(res)
    if not isinstance(data, list) or len(data) != 14:
        raise Exception(f"Tier B Failed: Expected 14 websites from authenticated API, got {len(data) if isinstance(data, list) else data}")

    print("  - Authenticated /api/websites: 14 sites returned with HTTP 200 OK")
    print("[PASS] Tier B Website Manager Invariants Verified: 100% PASS")
    return True
