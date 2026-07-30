import WebsiteCard from './WebsiteCard'
import './WebsiteGrid.css'

export default function WebsiteGrid({ websites }) {
  if (websites.length === 0) {
    return (
      <div className="wg-empty" role="status">
        <div className="wg-empty-icon" aria-hidden="true">🌐</div>
        <p className="wg-empty-title">No websites found</p>
        <p className="wg-empty-sub">Try adjusting your search or filter.</p>
      </div>
    )
  }

  return (
    <section className="website-grid" aria-label="Websites">
      {websites.map(site => (
        <WebsiteCard key={site.id} website={site} />
      ))}
    </section>
  )
}
