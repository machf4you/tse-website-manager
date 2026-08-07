import './ActionBar.css'

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
)

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
  </svg>
)

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
  </svg>
)

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
)

export default function ActionBar({ searchQuery, onSearchChange }) {
  return (
    <div className="action-bar" role="toolbar" aria-label="Website actions">
      {/* Search */}
      <div className="search-wrapper">
        <span className="search-icon" aria-hidden="true"><SearchIcon /></span>
        <input
          type="search"
          className="search-input"
          placeholder="Search websites…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search websites"
          id="website-search"
        />
      </div>

      {/* Actions */}
      <div className="action-buttons">
        <button type="button" className="btn-primary" id="btn-add-website">
          <PlusIcon /> Add Website
        </button>
        <button type="button" className="btn-secondary" id="btn-import" title="Import">
          <UploadIcon /> Import
        </button>
        <button type="button" className="btn-secondary" id="btn-export" title="Export">
          <DownloadIcon /> Export
        </button>
        <button type="button" className="btn-icon" id="btn-refresh" title="Refresh">
          <RefreshIcon />
        </button>
      </div>
    </div>
  )
}
