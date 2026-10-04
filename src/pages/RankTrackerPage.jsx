import { useState, useEffect } from 'react'
import './RankTrackerPage.css'

const RefreshIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
)

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)

export default function RankTrackerPage({ site, onBack, onNavigateTab }) {
  const [rankings, setRankings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncingKR, setIsSyncingKR] = useState(false)
  const [checkingPageKey, setCheckingPageKey] = useState(null)
  const [isCheckingAll, setIsCheckingAll] = useState(false)
  const [notification, setNotification] = useState(null)

  const siteId = site?.id

  const fetchRankings = async () => {
    if (!siteId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/websites/${siteId}/rankings`)
      if (res.ok) {
        const data = await res.json()
        const rows = Object.values(data || {})
        setRankings(rows)
      }
    } catch (e) {
      console.error('Error fetching rankings:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRankings()
  }, [siteId])

  // Sync approved Keyword Research target phrases for this website
  const handleSyncKeywordResearch = async () => {
    if (!siteId || isSyncingKR) return
    setIsSyncingKR(true)
    setNotification(null)

    try {
      const res = await fetch(`/api/websites/${siteId}/sync-keyword-research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setNotification({
          type: 'success',
          message: `✓ Successfully synced ${data.count} approved primary target phrases from Keyword Research!`
        })
        await fetchRankings()
      } else {
        setNotification({
          type: 'info',
          message: data.message || data.error || 'No approved Keyword Research project matched this website.'
        })
      }
    } catch (e) {
      console.error('Error syncing keyword research:', e)
      setNotification({
        type: 'error',
        message: 'Failed to connect to Keyword Research sync endpoint.'
      })
    } finally {
      setIsSyncingKR(false)
    }
  }

  // Trigger rank check for a single phrase via DataForSEO
  const handleCheckRank = async (row) => {
    if (!siteId || checkingPageKey) return
    setCheckingPageKey(row.pageKey)

    try {
      const res = await fetch(`/api/websites/${siteId}/check-rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageKey: row.pageKey,
          targetPhrase: row.targetPhrase,
          configuredUrl: row.rankingUrl || row.pageKey
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setNotification({
          type: 'success',
          message: `✓ Live rank check completed for "${row.targetPhrase}": Rank ${data.googleRank ? '#' + data.googleRank : '>100'}`
        })
        await fetchRankings()
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Live rank check failed.'
        })
      }
    } catch (e) {
      console.error('Error checking rank:', e)
    } finally {
      setCheckingPageKey(null)
    }
  }

  // Trigger rank check for all phrases sequentially
  const handleCheckAll = async () => {
    if (!siteId || isCheckingAll || rankings.length === 0) return
    setIsCheckingAll(true)
    setNotification({
      type: 'info',
      message: `Running DataForSEO rank checks for ${rankings.length} target phrases...`
    })

    for (const r of rankings) {
      setCheckingPageKey(r.pageKey)
      try {
        await fetch(`/api/websites/${siteId}/check-rank`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageKey: r.pageKey,
            targetPhrase: r.targetPhrase,
            configuredUrl: r.rankingUrl || r.pageKey
          })
        })
      } catch (e) {
        console.error('Error in batch item rank check:', e)
      }
    }

    setCheckingPageKey(null)
    setIsCheckingAll(false)
    setNotification({
      type: 'success',
      message: '✓ Batch DataForSEO rank checks completed!'
    })
    await fetchRankings()
  }

  // Calculated Metrics
  const totalPhrases = rankings.length
  const top100Count = rankings.filter(r => r.googleRank && r.googleRank <= 100).length
  const top10Count = rankings.filter(r => r.googleRank && r.googleRank <= 10).length
  const rankedRanks = rankings.map(r => r.googleRank).filter(Boolean)
  const avgRank = rankedRanks.length > 0 ? (rankedRanks.reduce((a, b) => a + b, 0) / rankedRanks.length).toFixed(1) : 'N/A'

  const formatVolume = (vol) => {
    if (vol === null || vol === undefined || isNaN(vol)) return '-'
    return Number(vol).toLocaleString()
  }

  const renderRankBadge = (rank) => {
    if (!rank || rank > 100) {
      return <span className="rt-rank-badge not-ranking">&gt;100</span>
    }
    if (rank <= 10) {
      return <span className="rt-rank-badge top-10">#{rank}</span>
    }
    return <span className="rt-rank-badge top-100">#{rank}</span>
  }

  const renderChangeBadge = (row) => {
    const current = row.googleRank
    const prev = row.previousRank

    if (current === null || current === undefined) return <span className="rt-change-badge same">-</span>
    if (prev === null || prev === undefined) return <span className="rt-change-badge new">New</span>

    const change = prev - current
    if (change > 0) {
      return <span className="rt-change-badge up">+{change}</span>
    } else if (change < 0) {
      return <span className="rt-change-badge down">{change}</span>
    }
    return <span className="rt-change-badge same">0</span>
  }

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Never'
    try {
      const d = new Date(isoStr)
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    } catch (e) {
      return isoStr
    }
  }

  return (
    <div className="rank-tracker-page">
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          className="w2-btn-back"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          ← Back to W3 Page Manager
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="rt-nav-btn-social"
            id="btn-rt-social"
            onClick={() => onNavigateTab && onNavigateTab('w7')}
            style={{
              background: 'rgba(236, 72, 153, 0.12)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              color: '#f472b6',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            W7 | Social
          </button>
          <button
            type="button"
            className="rt-nav-btn-backlinks"
            id="btn-rt-backlinks"
            onClick={() => onNavigateTab && onNavigateTab('w8')}
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            W8 | Backlinks
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="rt-header-card">
        <div className="rt-header-info">
          <span className="rt-pill-tag">W6 | RANK TRACKER</span>
          <h1 className="rt-title">Rank Tracker — {site?.name}</h1>
          <p className="rt-subtitle">
            <span>Google UK (google.co.uk)</span> • 
            <span>Mobile Device</span> • 
            <span>Depth 100 (DataForSEO)</span>
          </p>
        </div>

        <div className="rt-header-actions">
          <button
            type="button"
            className="rt-btn-secondary"
            onClick={handleSyncKeywordResearch}
            disabled={isSyncingKR}
          >
            <RefreshIcon className={isSyncingKR ? 'icon-spin' : ''} />
            {isSyncingKR ? 'Importing Phrases...' : 'Import Phrases from Keyword Research'}
          </button>
          <button
            type="button"
            className="rt-btn-primary"
            onClick={handleCheckAll}
            disabled={isCheckingAll || rankings.length === 0}
          >
            <RefreshIcon className={isCheckingAll ? 'icon-spin' : ''} />
            {isCheckingAll ? 'Checking Rankings...' : 'Check All Rankings'}
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: 600,
          backgroundColor: notification.type === 'success' ? 'rgba(16,185,129,0.15)' : (notification.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.15)'),
          color: notification.type === 'success' ? '#86efac' : (notification.type === 'error' ? '#fca5a5' : '#7dd3fc'),
          border: `1px solid ${notification.type === 'success' ? '#10b981' : (notification.type === 'error' ? '#ef4444' : '#0284c7')}`
        }}>
          {notification.message}
        </div>
      )}

      {/* Stat Metric Cards */}
      <div className="rt-stats-grid">
        <div className="rt-stat-card">
          <span className="rt-stat-label">Total Target Phrases</span>
          <span className="rt-stat-value val-sky">{totalPhrases}</span>
        </div>
        <div className="rt-stat-card">
          <span className="rt-stat-label">Pages in Top 100</span>
          <span className="rt-stat-value val-emerald">{top100Count}</span>
        </div>
        <div className="rt-stat-card">
          <span className="rt-stat-label">Pages in Top 10</span>
          <span className="rt-stat-value val-emerald">{top10Count}</span>
        </div>
        <div className="rt-stat-card">
          <span className="rt-stat-label">Average Rank</span>
          <span className="rt-stat-value val-amber">{avgRank}</span>
        </div>
      </div>

      {/* Rank Tracker Table */}
      <div className="rt-table-container">
        <div className="rt-table-header-row">
          <h2 className="rt-table-title">Target Phrases & Keyword Rankings</h2>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Loading rankings data...
          </div>
        ) : rankings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>No approved target phrases configured for this website yet.</p>
            <button
              type="button"
              className="rt-btn-primary"
              onClick={handleSyncKeywordResearch}
              disabled={isSyncingKR}
            >
              Import Phrases from Keyword Research
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="rt-table">
              <thead>
                <tr>
                  <th>Target Phrase</th>
                  <th>Target Page</th>
                  <th>Volume</th>
                  <th>Current Rank</th>
                  <th>Previous Rank</th>
                  <th>Change</th>
                  <th>Last Checked</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((row, idx) => (
                  <tr key={`${row.pageKey}_${row.phraseType || 'primary'}_${row.targetPhrase || idx}`}>
                    <td>
                      <span className="rt-phrase-tag">
                        <TargetIcon /> {row.targetPhrase}
                      </span>
                    </td>
                    <td>
                      <span className="rt-slug-tag">{row.pageKey}</span>
                    </td>
                    <td>{formatVolume(row.searchVolume)}</td>
                    <td>{renderRankBadge(row.googleRank)}</td>
                    <td>
                      {row.previousRank ? (
                        row.previousRank <= 100 ? `#${row.previousRank}` : '>100'
                      ) : '-'}
                    </td>
                    <td>{renderChangeBadge(row)}</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {formatDate(row.lastCheckedAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="rt-btn-check-sm"
                        onClick={() => handleCheckRank(row)}
                        disabled={checkingPageKey === `${row.pageKey}:${row.phraseType || 'primary'}` || isCheckingAll}
                      >
                        {checkingPageKey === `${row.pageKey}:${row.phraseType || 'primary'}` ? 'Checking...' : 'Check Rank'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
