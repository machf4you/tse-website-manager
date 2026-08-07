/**
 * Master restore point data representing RESTORE-POINT-INDEX.md.
 * One source of truth for the Restore Points manager.
 */
export const restorePointIndexData = [
  {
    id: 'v1.2',
    version: 'v1.2',
    gitTag: 'v1.2-wordpress-synchronisation-architecture',
    commit: 'd2d4b62',
    date: '07-08-2026',
    title: 'WordPress Synchronisation Architecture',
    description: 'Complete and approved WordPress Synchronisation Architecture. Integration contracts, package versioning, packageId (UUID), and orchestration boundaries frozen baseline before implementation.',
    status: 'Current',
    docFile: 'RESTORE-POINT-v1.2-wordpress-synchronisation-architecture.md',
  },
  {
    id: 'v1.1',
    version: 'v1.1',
    gitTag: 'v1.1-foundation-master-tile',
    commit: '61c1e83',
    date: '07-08-2026',
    title: 'Foundation Master Tile',
    description: 'Project Foundation complete and approved. Automatic deployment verified via TSE Deployer. Master Website Tile built and approved.',
    status: 'Superseded',
    docFile: 'RESTORE-POINT-v1.1-foundation-master-tile.md',
  },
  {
    id: 'v1.2-old',
    version: 'v1.2-old',
    gitTag: 'v1.2-websites-dashboard',
    commit: '9f42b7e',
    date: '30-07-2026',
    title: 'Websites Dashboard',
    description: 'Milestone 2 dashboard with sidebar, summary cards and website grid. Superseded when dashboard was cleared for master tile approach.',
    status: 'Superseded',
    docFile: 'RESTORE-POINT-v1.2-websites-dashboard.md',
  },
  {
    id: 'v1.0',
    version: 'v1.0',
    gitTag: 'v1.0-clean-foundation',
    commit: '8464b6f',
    date: '30-07-2026',
    title: 'Clean Foundation',
    description: 'Clean Vite + React foundation. GitHub Pages deployment configured (later replaced by TSE Deployer). No application code.',
    status: 'Superseded',
    docFile: 'RESTORE-POINT-v1.0-clean-foundation.md',
  },
]
