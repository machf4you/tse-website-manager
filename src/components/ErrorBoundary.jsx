import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React ErrorBoundary Caught Error]:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    try {
      localStorage.removeItem('tse_active_tab_1')
      localStorage.removeItem('tse_active_tab_default')
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: '#f8fafc',
          fontFamily: "'Inter', system-ui, sans-serif"
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '32px 40px',
            maxWidth: '560px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 8px 0', color: '#f87171' }}>
              Application Render Notice
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              An unexpected display issue occurred. Your data is safe and persisted in the database.
            </p>
            {this.state.error && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: '#fca5a5',
                textAlign: 'left',
                marginBottom: '24px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: '120px'
              }}>
                {String(this.state.error?.message || this.state.error)}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: '1px solid #1d4ed8',
                  borderRadius: '6px',
                  padding: '10px 22px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(37,99,235,0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
