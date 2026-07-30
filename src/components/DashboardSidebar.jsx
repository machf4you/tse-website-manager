import './DashboardSidebar.css'

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
)

const SlidersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" />
    <line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" />
    <line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" />
    <line x1="2" x2="6" y1="14" y2="14" /><line x1="10" x2="14" y1="8" y2="8" />
    <line x1="18" x2="22" y1="16" y2="16" />
  </svg>
)

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

export default function DashboardSidebar({ activeFilter, onFilterChange, counts }) {
  const navItems = [
    { id: 'websites', label: 'Websites', icon: <GlobeIcon />, active: true },
    { id: 'global-settings', label: 'Global Settings', icon: <SlidersIcon />, active: false },
  ]

  const filters = [
    { id: 'all', label: 'All Websites', count: counts.all },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'inactive', label: 'Inactive', count: counts.inactive },
  ]

  return (
    <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
      {/* Navigation */}
      <div className="sidebar-section">
        <span className="sidebar-section-label">Navigation</span>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
              aria-current={item.active ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="sidebar-section">
        <span className="sidebar-section-label">
          <FilterIcon /> Filter
        </span>
        <div className="sidebar-filters">
          {filters.map(f => (
            <button
              key={f.id}
              type="button"
              className={`sidebar-filter-item ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => onFilterChange(f.id)}
            >
              <span className="filter-label">{f.label}</span>
              <span className="filter-badge">{f.count}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
