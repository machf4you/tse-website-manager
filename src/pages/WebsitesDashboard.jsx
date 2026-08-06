import WebsiteTile from '../components/WebsiteTile'
import { mockSiteTile } from '../data/mockData'
import './WebsitesDashboard.css'

export default function WebsitesDashboard() {
  return (
    <div className="tile-preview-page">
      <WebsiteTile site={mockSiteTile} />
    </div>
  )
}
