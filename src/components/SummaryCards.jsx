import './SummaryCards.css'

const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
  </svg>
)

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </svg>
)

function formatRelativeTime(isoString) {
  if (!isoString) return 'Never'
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (hours < 1) return `${mins}m ago`
  if (days < 1) return `${hours}h ago`
  return `${days}d ago`
}

const cards = (stats) => [
  {
    id: 'total-websites',
    label: 'Total Websites',
    value: stats.totalWebsites,
    sub: 'Across all environments',
    icon: <GridIcon />,
    color: 'green',
  },
  {
    id: 'active-websites',
    label: 'Active Websites',
    value: stats.activeWebsites,
    sub: `${stats.totalWebsites - stats.activeWebsites} inactive`,
    icon: <CheckCircleIcon />,
    color: 'blue',
  },
  {
    id: 'total-pages',
    label: 'Total Pages',
    value: stats.totalPages.toLocaleString(),
    sub: 'Indexed across all sites',
    icon: <FileIcon />,
    color: 'purple',
  },
  {
    id: 'last-scan',
    label: 'Last Scan',
    value: formatRelativeTime(stats.lastScan),
    sub: 'Automated full crawl',
    icon: <ClockIcon />,
    color: 'orange',
  },
  {
    id: 'ai-credits',
    label: 'AI Credits',
    value: stats.aiCredits.toLocaleString(),
    sub: 'Available this month',
    icon: <ZapIcon />,
    color: 'teal',
  },
]

export default function SummaryCards({ stats }) {
  return (
    <div className="summary-cards" role="region" aria-label="Summary statistics">
      {cards(stats).map(card => (
        <div key={card.id} className="summary-card" id={`stat-${card.id}`}>
          <div className={`card-icon-wrap icon-${card.color}`}>
            {card.icon}
          </div>
          <div className="card-body">
            <span className="card-label">{card.label}</span>
            <span className="card-value">{card.value}</span>
            <span className="card-sub">{card.sub}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
