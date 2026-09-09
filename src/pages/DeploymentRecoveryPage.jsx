import './DeploymentRecoveryPage.css'

export default function DeploymentRecoveryPage() {
  const sequenceSteps = [
    { num: '1', name: 'Development', desc: 'Code implemented and verified locally.' },
    { num: '2', name: 'Commit', desc: 'Working changes staged and committed.' },
    { num: '3', name: 'Push to origin/main', desc: 'Pushed to GitHub canonical authority.' },
    { num: '4', name: 'VPS Fetch', desc: 'Fetch latest references on production server.' },
    { num: '5', name: 'Verify VPS HEAD', desc: 'Confirm VPS HEAD matches origin/main.' },
    { num: '6', name: 'Clean Tree Check', desc: 'Ensure no untracked or modified files.' },
    { num: '7', name: 'Deployment Guard', desc: 'Automated pre-build validation executed.' },
    { num: '8', name: 'Production Build', desc: 'npm run build via safe deploy script.' },
    { num: '9', name: 'Public Verification', desc: 'Automated bundle hash & route check.' },
    { num: '10', name: 'Mac Verification', desc: 'Visual confirmation in live browser.' },
    { num: '11', name: 'Stable Restore Point', desc: 'Full recovery point & archive created.' },
  ]

  const protectionChecklist = [
    'GitHub canonical source (origin/main is single source of truth)',
    'Local / Origin / VPS commit alignment verified',
    'Compressed source archive generated with SHA256 checksum',
    'PostgreSQL database dump created and archived',
    'Active Nginx server block configurations backed up',
    'PM2 process ecosystem saved and dumped',
    'IndexChecker 03:00 UTC server cron backed up',
    'Automated pre-build deployment guard script active',
    'Controlled production deployment runner installed',
    'Hard blocking on dirty or stale repository states'
  ]

  return (
    <div className="dr-container">
      {/* Header */}
      <div className="dr-header-row">
        <div>
          <h2 className="dr-title">Deployment &amp; Recovery</h2>
          <p className="dr-subtitle">
            Canonical source standards, safe deployment sequences, and protected restore point registry.
          </p>
        </div>
      </div>

      {/* Top Cards: Canonical Source & Production Build Rule */}
      <div className="dr-grid-2">
        <div className="dr-card">
          <div className="dr-card-header">
            <div className="dr-card-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </div>
            <h3 className="dr-card-title">CANONICAL SOURCE</h3>
          </div>
          <p className="dr-text-highlight">
            GitHub <code>origin/main</code> is the single production source of truth.
          </p>
          <div className="dr-prohibit-box">
            <div className="dr-prohibit-title">Production must NEVER be built from:</div>
            <ul className="dr-list-prohibit">
              <li>Uncommitted local files</li>
              <li>Unpushed local commits</li>
              <li>Scratch or temporary files</li>
              <li>Stale VPS source trees</li>
              <li>Manually reconstructed source trees</li>
            </ul>
          </div>
        </div>

        <div className="dr-card">
          <div className="dr-card-header">
            <div className="dr-card-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            </div>
            <h3 className="dr-card-title">PRODUCTION BUILD RULE</h3>
          </div>
          <p className="dr-text-highlight">
            Direct <code>npm</code> production builds on the VPS are prohibited.
          </p>
          <p className="dr-text-sub">
            Production deployment must exclusively use the controlled deployment script.
          </p>
          <div className="dr-prohibit-box">
            <div className="dr-prohibit-title">A deployment must automatically abort if:</div>
            <ul className="dr-list-prohibit">
              <li>Repository working tree is dirty</li>
              <li>Untracked source files exist</li>
              <li>Current branch is not <code>main</code></li>
              <li>VPS HEAD differs from <code>origin/main</code></li>
              <li>Remote origin cannot be verified</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Safe Deployment Sequence */}
      <div className="dr-card">
        <div className="dr-card-header">
          <div className="dr-card-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <h3 className="dr-card-title">SAFE DEPLOYMENT SEQUENCE</h3>
        </div>
        <div className="dr-sequence-grid">
          {sequenceSteps.map((s) => (
            <div key={s.num} className="dr-sequence-step">
              <div className="dr-step-badge">{s.num}</div>
              <div className="dr-step-name">{s.name}</div>
              <div className="dr-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Restore Point Rule */}
      <div className="dr-card">
        <div className="dr-card-header">
          <div className="dr-card-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3 className="dr-card-title">RESTORE POINT RULE</h3>
        </div>
        <p className="dr-text-highlight">
          A state may only be labelled <strong>STABLE</strong> after all 8 conditions are satisfied:
        </p>
        <ol className="dr-ordered-rules">
          <li><strong>Mac has visually verified the live application</strong> in the browser.</li>
          <li>Exact working source is committed to git.</li>
          <li>Commit is pushed to <code>origin/main</code>.</li>
          <li>VPS is confirmed on the identical commit.</li>
          <li>Annotated Git tag is created and pushed to origin.</li>
          <li>Full compressed source backup archive is generated.</li>
          <li>Database backup is generated where applicable.</li>
          <li>Relevant server and proxy configurations are backed up.</li>
        </ol>
        <div className="dr-notice-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>&quot;Build passed&quot; or &quot;API healthy&quot; does NOT constitute live verification.</span>
        </div>
      </div>

      {/* Current Protected Restore Point */}
      <div className="dr-card dr-card-protected">
        <div className="dr-card-header">
          <div className="dr-card-icon-wrap dr-icon-green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
          </div>
          <div>
            <h3 className="dr-card-title">CURRENT PROTECTED RESTORE POINT</h3>
            <span className="dr-status-badge">PROTECTED</span>
          </div>
        </div>

        <div className="dr-restore-details-grid">
          <div className="dr-detail-item">
            <span className="dr-detail-label">Application</span>
            <span className="dr-detail-val">TSE Site Registry</span>
          </div>
          <div className="dr-detail-item">
            <span className="dr-detail-label">Restore Point</span>
            <span className="dr-detail-val"><code>V2.16-STABLE-FULL-RECOVERY-POST-ROLLBACK</code></span>
          </div>
          <div className="dr-detail-item">
            <span className="dr-detail-label">Canonical Commit</span>
            <span className="dr-detail-val"><code>5d49690129bff6785ac3acaf55a52aed71bd70ca</code></span>
          </div>
          <div className="dr-detail-item">
            <span className="dr-detail-label">Git Tag</span>
            <span className="dr-detail-val"><code>v2.16-stable-full-recovery-post-rollback</code></span>
          </div>
          <div className="dr-detail-item">
            <span className="dr-detail-label">Date</span>
            <span className="dr-detail-val">9 September 2026</span>
          </div>
          <div className="dr-detail-item">
            <span className="dr-detail-label">Protection Status</span>
            <span className="dr-detail-val dr-text-green">Verified &amp; Guarded</span>
          </div>
        </div>

        <div className="dr-checklist-box">
          <div className="dr-checklist-title">Protection Safeguards Active:</div>
          <div className="dr-checklist-grid">
            {protectionChecklist.map((item, idx) => (
              <div key={idx} className="dr-check-item">
                <span className="dr-check-mark">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
