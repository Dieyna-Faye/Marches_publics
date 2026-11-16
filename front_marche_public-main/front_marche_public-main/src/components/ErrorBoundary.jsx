import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ProcureAI ErrorBoundary] Erreur d’affichage capturée :', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px',
          fontFamily: 'inherit',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '560px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
              fontSize: '24px',
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f2744', marginBottom: '10px' }}>
              Une difficulté d’affichage est survenue
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: 1.6 }}>
              L’application a rencontré une anomalie inattendue lors du rendu de cette section.
              Vous pouvez rafraîchir la page ou revenir à l’espace principal.
            </p>
            {this.state.error?.message && (
              <pre style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#991b1b',
                overflowX: 'auto',
                textAlign: 'left',
                marginBottom: '20px',
              }}>
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  background: '#0f2744',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Actualiser la page
              </button>
              <a
                href="/app/appels-offres"
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Retour aux Appels d’Offres
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

