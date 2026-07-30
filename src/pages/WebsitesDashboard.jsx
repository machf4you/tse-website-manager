import { useState, useMemo } from 'react'
import DashboardSidebar from '../components/DashboardSidebar'
import ActionBar from '../components/ActionBar'
import SummaryCards from '../components/SummaryCards'
import WebsiteGrid from '../components/WebsiteGrid'
import { mockWebsites, mockStats } from '../data/mockData'
import './WebsitesDashboard.css'

export default function WebsitesDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  // Derive filtered list
  const filteredWebsites = useMemo(() => {
    let list = mockWebsites

    if (activeFilter !== 'all') {
      list = list.filter(site => site.status === activeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        site =>
          site.name.toLowerCase().includes(q) ||
          site.domain.toLowerCase().includes(q) ||
          site.category.toLowerCase().includes(q)
      )
    }

    return list
  }, [searchQuery, activeFilter])

  const counts = useMemo(() => ({
    all: mockWebsites.length,
    active: mockWebsites.filter(s => s.status === 'active').length,
    inactive: mockWebsites.filter(s => s.status === 'inactive').length,
  }), [])

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar */}
      <DashboardSidebar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Page Title */}
        <div className="dashboard-title-row">
          <div>
            <h2 className="dashboard-title">Websites</h2>
            <p className="dashboard-subtitle">
              Manage and monitor all your websites from one place.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards stats={mockStats} />

        {/* Action Bar */}
        <ActionBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Results label */}
        <div className="dashboard-results-row">
          <span className="results-count">
            {filteredWebsites.length === mockWebsites.length
              ? `${mockWebsites.length} websites`
              : `${filteredWebsites.length} of ${mockWebsites.length} websites`}
          </span>
        </div>

        {/* Website Grid */}
        <WebsiteGrid websites={filteredWebsites} />
      </div>
    </div>
  )
}
