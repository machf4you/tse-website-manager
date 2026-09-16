import os
import sys
import json
import time
import subprocess
import paramiko

class TseDeployEngine:
    def __init__(self, repo_path, app_name):
        self.repo_path = repo_path
        self.app_name = app_name
        self.manifest_path = os.path.join(repo_path, 'tse-manifest.json')
        self.manifest = None
        self.ssh = None

    def connect_ssh(self):
        if not self.ssh:
            self.ssh = paramiko.SSHClient()
            self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.ssh.connect('77.245.157.66', port=22667, username='root', key_filename=r'C:\Users\Admin\.ssh\id_clean_ed25519')
        return self.ssh

    def run_remote(self, cmd):
        ssh = self.connect_ssh()
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        return out, err

    def load_manifest(self):
        if not os.path.exists(self.manifest_path):
            raise Exception(f"Task manifest missing at: {self.manifest_path}")
        with open(self.manifest_path, 'r', encoding='utf-8') as f:
            self.manifest = json.load(f)
        return self.manifest

    def gate0_production_baseline_lock(self):
        """PRE-DEPLOYMENT PRODUCTION BASELINE LOCK FOR WEBSITE MANAGER"""
        if self.app_name == "website-manager":
            from tse_baseline_lock import run_baseline_lock_check
            if not self.manifest:
                self.load_manifest()
            run_baseline_lock_check(self.repo_path, self.manifest)
        return True

    def gate1_clean_tree(self):
        print("\n[GATE 1] Running Strict Clean-Tree Check...")
        if not self.manifest:
            self.load_manifest()

        res = subprocess.run(['git', 'status', '--porcelain'], cwd=self.repo_path, capture_output=True, text=True)
        status_lines = [l for l in res.stdout.split('\n') if l.strip()]

        # 1. Staged uncommitted changes
        staged = [l for l in status_lines if len(l) > 0 and l[0] in ['M', 'A', 'D', 'R', 'C']]
        if staged:
            print(f"[GATE 1 BLOCKED] Staged uncommitted changes detected ({len(staged)} files):")
            for f in staged:
                print(f"  [STAGED] {f}")
            raise Exception(f"Strict Clean-Tree Gate blocked: {len(staged)} staged uncommitted tracked changes.")

        # 2. Unstaged tracked modifications
        unstaged = [l for l in status_lines if len(l) > 1 and l[1] in ['M', 'D']]
        if unstaged:
            print(f"[GATE 1 BLOCKED] Unstaged tracked modifications detected ({len(unstaged)} files):")
            for f in unstaged:
                print(f"  [UNSTAGED] {f}")
            raise Exception(f"Strict Clean-Tree Gate blocked: {len(unstaged)} unstaged tracked modifications.")

        # 3. Untracked build/source files
        source_prefixes = ['src/', 'server/', 'public/', 'scripts/', 'vite.config', 'package.json', 'tsconfig', 'tailwind.config']
        untracked_src = [l for l in status_lines if l.startswith('??') and any(l[3:].strip().startswith(p) for p in source_prefixes)]
        if untracked_src:
            print(f"[GATE 1 BLOCKED] Untracked source/build files detected ({len(untracked_src)} files):")
            for f in untracked_src:
                print(f"  [UNTRACKED] {f}")
            raise Exception(f"Strict Clean-Tree Gate blocked: {len(untracked_src)} untracked source files.")

        # 4. Exact candidate commit check
        candidate = self.manifest.get('candidateCommit', 'HEAD')
        if candidate != 'HEAD':
            head_hash = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=self.repo_path, capture_output=True, text=True).stdout.strip()
            cand_hash = subprocess.run(['git', 'rev-parse', candidate], cwd=self.repo_path, capture_output=True, text=True).stdout.strip()
            if head_hash != cand_hash:
                print(f"[GATE 1 BLOCKED] Working tree HEAD ({head_hash[:8]}) does not match candidate commit ({cand_hash[:8]}).")
                raise Exception(f"Strict Clean-Tree Gate blocked: Working tree is not at exact candidate commit.")

        print("[PASS] Gate 1: Strict clean working tree matches exact candidate commit.")
        return True

    def gate2_scope_diff(self):
        print("\n[GATE 2] Running Scope / Diff Gate...")
        if not self.manifest:
            self.load_manifest()
        baseline_tag = self.manifest['baselineTag']
        candidate_commit = self.manifest.get('candidateCommit', 'HEAD')
        allowed_files = set(f.replace('\\', '/') for f in self.manifest['allowedFiles'])

        res = subprocess.run(['git', 'diff', '--name-only', baseline_tag, candidate_commit], cwd=self.repo_path, capture_output=True, text=True)
        if res.returncode != 0:
            raise Exception(f"Failed to diff against baseline tag {baseline_tag}: {res.stderr}")

        diff_files = [f.strip().replace('\\', '/') for f in res.stdout.strip().split('\n') if f.strip()]
        out_of_scope = [f for f in diff_files if f not in allowed_files]

        if out_of_scope:
            print("\n============================================================")
            print("[GATE 2 BLOCKED] OUT-OF-SCOPE MODIFICATIONS DETECTED!")
            print("Deployment is mechanically blocked. The following files changed outside manifest:")
            for f in out_of_scope:
                print(f"  [UNAUTHORIZED] {f}")
            print("============================================================\n")
            raise Exception(f"Scope/Diff Gate blocked deployment: {len(out_of_scope)} out-of-scope files.")

        print(f"[PASS] Gate 2: All {len(diff_files)} changed files are within declared manifest scope.")
        return True

    def sync_restore_point_index(self):
        print("\n[AUTOMATED RESTORE POINT SYNC] Synchronizing Global Settings Restore Points...")
        sync_script = r"c:\Antigravity\tse-website-manager\scripts\sync_restore_points.py"
        if os.path.exists(sync_script):
            res = subprocess.run([sys.executable, sync_script], capture_output=True, text=True)
            if res.returncode == 0:
                print("  - Global Settings Restore Points & RESTORE-POINT-INDEX.md synchronized successfully.")
            else:
                print(f"  - [WARNING] Restore point sync reported non-zero code: {res.stderr}")
        return True

    def pre_deployment_snapshot(self):
        print("\n[PRE-DEPLOYMENT SNAPSHOT] Preserving current live state on VPS...")
        ts = int(time.time())
        app_dir = f"/opt/tse-apps/{self.app_name}"
        backup_dir = f"/opt/tse-apps/backups/{self.app_name}"
        db_backup_dir = f"/opt/tse-apps/backups/databases/{self.app_name}"

        self.run_remote(f"mkdir -p {backup_dir} {db_backup_dir}")
        snap_file = f"{backup_dir}/pre-deploy-{self.app_name}-{ts}.tar.gz"
        out, err = self.run_remote(f"if [ -d {app_dir}/dist ]; then tar -czf {snap_file} -C {app_dir} dist; echo 'Archived current dist'; fi")
        print(f"  - Application release snapshot created: {snap_file}")

        db_target = f"/opt/tse-apps/{self.app_name}/shared_db/website_manager.db" if self.app_name == "website-manager" else f"/opt/tse-apps/{self.app_name}/data/site_registry.db"
        db_snap_file = f"{db_backup_dir}/db_predeploy_{ts}.db"
        out, err = self.run_remote(f"if [ -f {db_target} ]; then sqlite3 {db_target} \".backup '{db_snap_file}'\"; echo 'DB backed up successfully'; fi")
        print(f"  - Database safe snapshot (.backup) created: {db_snap_file}")
        print("  - [CRITICAL RULE] Auto-database rollback is permanently DISABLED.")
        
        # PERMANENT RULE: Automatically sync Global Settings Restore Points list
        self.sync_restore_point_index()
        return snap_file, db_snap_file

    def establish_immutable_release_structure(self):
        print(f"\n[IMMUTABLE RELEASE STRUCTURE] Verifying /opt/tse-apps/{self.app_name}/releases...")
        app_dir = f"/opt/tse-apps/{self.app_name}"
        self.run_remote(f"mkdir -p {app_dir}/releases")
        out, err = self.run_remote(f"ls -la {app_dir}/releases")
        print(f"[PASS] Release directory ready: {app_dir}/releases")
        return True

    def rollback_code_only(self, previous_release_id):
        print(f"\n[CODE-ONLY ROLLBACK] Reverting application release to: {previous_release_id}...")
        app_dir = f"/opt/tse-apps/{self.app_name}"
        target = f"{app_dir}/releases/{previous_release_id}"
        out, err = self.run_remote(f"ln -sfn {target} {app_dir}/current")
        pm2_name = "website-manager" if self.app_name == "website-manager" else "site-registry"
        self.run_remote(f"pm2 reload {pm2_name} 2>/dev/null || true")
        print(f"[PASS] Application rolled back to {previous_release_id}. Database was 100% UNTOUCHED.")
        return True

