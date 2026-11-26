import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fallback-error">
          <h1>Ups, algo falló</h1>
          <p>La tienda no pudo cargar correctamente. Pulsa recargar (Ctrl+F5) y si persiste, reinicia con <code>npm start</code>.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Recargar página
          </button>
          <pre>{String(this.state.error?.message || this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}