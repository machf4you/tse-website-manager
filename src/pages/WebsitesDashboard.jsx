import { useState } from 'react'
import WebsiteTile from '../components/WebsiteTile'
import AddWebsiteDialog from '../components/AddWebsiteDialog'
import { mockSiteTile } from '../data/mockData'
import './WebsitesDashboard.css'

export default function WebsitesDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="tile-preview-page">

      {/* Add Website button */}
      <div className="tile-preview-actions">
        <button
          type="button"
          className="btn-add-website"
          id="btn-add-website"
          onClick={() => setDialogOpen(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            aria-hidden="true">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Website
        </button>
      </div>

      {/* Master tile */}
      <WebsiteTile site={mockSiteTile} />

      {/* Dialog */}
      <AddWebsiteDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

    </div>
  )
}
