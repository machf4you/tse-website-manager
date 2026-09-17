import { useState, useEffect, useMemo } from 'react'
import { getGlobalUrlExclusionsApi, addGlobalUrlExclusionApi, removeGlobalUrlExclusionApi } from '../services/websiteManagerApi'
import { DEFAULT_EXCLUSION_RULES } from '../utils/urlExclusions'
import './UrlExclusionsPage.css'

export default function UrlExclusionsPage() {
  const [rules, setRules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Add modal state
  const [newPattern, setNewPattern] = useState('')
  const [newMatchType, setNewMatchType] = useState('path-segment')
  const [newCategory, setNewCategory] = useState('Custom')
  const [newDescription, setNewDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const loadRules = async () => {
    setIsLoading(true)
    try {
      const serverRules = await getGlobalUrlExclusionsApi()
      if (Array.isArray(serverRules) && serverRules.length > 0) {
        setRules(serverRules)
      } else {
        setRules(DEFAULT_EXCLUSION_RULES)
      }
    } catch (e) {
      console.warn('Failed to fetch rules from server, using defaults:', e)
      setRules(DEFAULT_EXCLUSION_RULES)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [])

  const categories = useMemo(() => {
    const set = new Set(rules.map(r => r.category).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [rules])

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory
      const q = searchQuery.trim().toLowerCase()
      const matchQ = !q ||
        (r.pattern && r.pattern.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.matchType && r.matchType.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q))
      return matchCat && matchQ
    })
  }, [rules, selectedCategory, searchQuery])

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!newPattern.trim()) {
      setErrorMsg('Pattern is required')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    setFeedbackMsg(null)

    try {
      const res = await addGlobalUrlExclusionApi({
        pattern: newPattern.trim(),
        matchType: newMatchType,
        category: newCategory,
        description: newDescription.trim() || `Exclusion pattern for ${newPattern.trim()}`
      })

      if (res && res.success) {
        setRules(res.rules || [])
        const affected = res.affectedPagesCount || 0
        setFeedbackMsg(`Rule added successfully. Evaluated existing websites: ${affected} matching page${affected === 1 ? '' : 's'} automatically classified as Excluded.`)
        setNewPattern('')
        setNewDescription('')
        setIsAddModalOpen(false)
      } else {
        setErrorMsg(res?.error || 'Failed to add rule')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save rule')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (ruleId, pattern) => {
    if (!window.confirm(`Are you sure you want to remove the exclusion rule for "${pattern}"?\n\nExisting excluded pages will remain excluded until manually reclassified.`)) {
      return
    }

    try {
      const res = await removeGlobalUrlExclusionApi(ruleId)
      if (res && res.success) {
        setRules(res.rules || rules.filter(r => r.id !== ruleId))
        setFeedbackMsg(`Removed exclusion rule for "${pattern}". Existing page classifications are preserved.`)
      }
    } catch (err) {
      alert(`Failed to remove rule: ${err.message}`)
    }
  }

  return (
    <div className="url-exclusions-page">
      {/* Header */}
      <div className="ue-header">
        <div className="ue-header-text">
          <h2 className="ue-title">URL Exclusions</h2>
          <p className="ue-subtitle">
            Global URL exclusion rules for Website Manager. Pages matching these rules are automatically assigned the <strong>Excluded</strong> status (Priority 0) upon import and excluded from W3 target phrase optimization.
          </p>
        </div>
        <div className="ue-header-actions">
          <button
            type="button"
            className="ue-btn-add"
            onClick={() => {
              setErrorMsg(null)
              setIsAddModalOpen(true)
            }}
          >
            <span>+</span> Add Exclusion
          </button>
        </div>
      </div>

      {/* Feedback message banner */}
      {feedbackMsg && (
        <div className="ue-feedback-banner">
          <span>✓ {feedbackMsg}</span>
          <button type="button" className="ue-banner-close" onClick={() => setFeedbackMsg(null)}>✕</button>
        </div>
      )}

      {/* Filter / Search Toolbar */}
      <div className="ue-toolbar">
        <div className="ue-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            className="ue-search-input"
            placeholder="Search exclusion patterns or descriptions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="ue-search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="ue-filters-right">
          <select
            className="ue-category-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories ({rules.length})</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat} ({rules.filter(r => r.category === cat).length})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rules Table */}
      <div className="ue-table-container">
        {isLoading ? (
          <div className="ue-loading-state">Loading exclusion rules...</div>
        ) : filteredRules.length === 0 ? (
          <div className="ue-empty-state">No matching exclusion rules found.</div>
        ) : (
          <table className="ue-table">
            <thead>
              <tr>
                <th style={{ width: '36%' }}>PATTERN / KEYWORD</th>
                <th style={{ width: '22%' }}>MATCH TYPE</th>
                <th style={{ width: '24%' }}>CATEGORY</th>
                <th style={{ width: '18%', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule.id || rule.pattern}>
                  <td>
                    <div className="ue-pattern-cell">
                      <code className="ue-pattern-code">{rule.pattern}</code>
                      {rule.description && (
                        <span className="ue-pattern-desc">{rule.description}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`ue-match-badge ue-match-${rule.matchType || 'path-segment'}`}>
                      {rule.matchType === 'path-segment' ? 'Path Segment' :
                       rule.matchType === 'starts-with' ? 'Starts With' :
                       rule.matchType === 'ends-with' ? 'Ends With' :
                       rule.matchType === 'exact' ? 'Exact Path' :
                       rule.matchType === 'contains' ? 'Contains' :
                       rule.matchType === 'title-match' ? 'Title Match' :
                       rule.matchType === 'regex' ? 'Regex' : rule.matchType}
                    </span>
                  </td>
                  <td>
                    <span className="ue-category-pill">{rule.category || 'General'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="ue-btn-remove"
                      onClick={() => handleRemove(rule.id, rule.pattern)}
                      title={`Remove exclusion rule for "${rule.pattern}"`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Protected Non-URL System Rules Card */}
      <div className="ue-system-rules-card">
        <div className="ue-src-header">
          <span className="ue-src-badge">Protected System Exclusions</span>
          <span className="ue-src-note">Non-URL structural rules managed automatically by platform adapters</span>
        </div>
        <div className="ue-src-grid">
          <div className="ue-src-item">
            <span className="ue-src-item-title">Magento Container Categories</span>
            <span className="ue-src-item-desc">Categories with level &le; 1 (e.g. Root Catalog, Store Root) are automatically classified as Excluded (Priority 0).</span>
          </div>
          <div className="ue-src-item">
            <span className="ue-src-item-title">Magento Inactive Categories</span>
            <span className="ue-src-item-desc">Categories with is_active = false are automatically classified as Excluded (Priority 0).</span>
          </div>
        </div>
      </div>

      {/* Add Exclusion Modal Dialog */}
      {isAddModalOpen && (
        <div className="ue-modal-backdrop" onClick={() => !isSubmitting && setIsAddModalOpen(false)}>
          <div className="ue-modal-dialog" onClick={e => e.stopPropagation()} data-lpignore="true" data-1p-ignore="true" data-bwignore="true">
            <div className="ue-modal-header">
              <h3 className="ue-modal-title">Add Global URL Exclusion</h3>
              <button
                type="button"
                className="ue-modal-close"
                onClick={() => !isSubmitting && setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} data-lpignore="true" data-form-type="other" autoComplete="off">
              <div className="ue-modal-body">
                {errorMsg && (
                  <div className="ue-error-banner">
                    {errorMsg}
                  </div>
                )}

                <div className="ue-form-group">
                  <label className="ue-form-label" htmlFor="ue-new-pattern">
                    Pattern / Keyword <span className="ue-req">*</span>
                  </label>
                  <input
                    type="text"
                    id="ue-new-pattern"
                    className="ue-form-input"
                    placeholder="e.g. /finance-options/ or returns-policy"
                    value={newPattern}
                    onChange={e => setNewPattern(e.target.value)}
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    required
                    autoFocus
                  />
                  <span className="ue-form-hint">Matches against URL path, slug, or title according to Match Type.</span>
                </div>

                <div className="ue-form-group">
                  <label className="ue-form-label" htmlFor="ue-new-matchtype">
                    Match Type <span className="ue-req">*</span>
                  </label>
                  <select
                    id="ue-new-matchtype"
                    className="ue-form-select"
                    value={newMatchType}
                    onChange={e => setNewMatchType(e.target.value)}
                  >
                    <option value="path-segment">Path Segment (Slug or /path/ segment) - Recommended</option>
                    <option value="contains">Contains (in URL or query string)</option>
                    <option value="starts-with">Starts With (starts with path)</option>
                    <option value="exact">Exact Path (exact slug/path)</option>
                    <option value="ends-with">Ends With (e.g. .xml, /feed)</option>
                    <option value="title-match">Page Title Match (in title)</option>
                    <option value="regex">Regular Expression (Regex)</option>
                  </select>
                </div>

                <div className="ue-form-group">
                  <label className="ue-form-label" htmlFor="ue-new-category">
                    Category
                  </label>
                  <select
                    id="ue-new-category"
                    className="ue-form-select"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                  >
                    <option value="Custom">Custom</option>
                    <option value="Website Utility">Website Utility</option>
                    <option value="Legal & Policy">Legal & Policy</option>
                    <option value="Ecommerce & Account">Ecommerce & Account</option>
                    <option value="Search">Search</option>
                    <option value="WordPress / System">WordPress / System</option>
                  </select>
                </div>

                <div className="ue-form-group">
                  <label className="ue-form-label" htmlFor="ue-new-desc">
                    Description / Notes
                  </label>
                  <input
                    type="text"
                    id="ue-new-desc"
                    className="ue-form-input"
                    placeholder="e.g. Exclude customer finance options pages"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                  />
                </div>

                <div className="ue-modal-note">
                  <strong>Instant Re-classification:</strong> Adding this rule will immediately check all existing imported pages across all websites and automatically classify any matching page as <strong>Excluded (Priority 0)</strong>.
                </div>
              </div>

              <div className="ue-modal-footer">
                <button
                  type="button"
                  className="ue-btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ue-btn-save"
                  disabled={isSubmitting || !newPattern.trim()}
                >
                  {isSubmitting ? 'Adding...' : 'Add Global Exclusion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
