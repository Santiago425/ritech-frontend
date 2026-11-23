import { Component } from 'react'
import Icono from './Icono.jsx'

export default class LimiteError extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    const esCarga = /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(this.state.error?.message ?? '')
    return (
      <div className="tarjeta">
        <div className="estado-vista estado-vista--error" role="alert">
          <Icono nombre="alerta" tam={28} />
          <p>{esCarga ? 'Hay una versión nueva de la aplicación. Recarga la página para continuar.' : 'Algo salió mal al mostrar esta página.'}</p>
          <button className="boton boton--secundario" onClick={() => window.location.reload()}>
            <Icono nombre="recargar" tam={16} /> Recargar
          </button>
        </div>
      </div>
    )
  }
}
