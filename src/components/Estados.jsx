import Icono from './Icono.jsx'
import Ilustracion from './Ilustracion.jsx'
import { ILUSTRACION_POR_ICONO } from '../ilustraciones.js'

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="estado-vista" role="status">
      <span className="spinner" />
      <p>{texto}</p>
    </div>
  )
}

export function ErrorCaja({ error, onReintentar }) {
  return (
    <div className="estado-vista estado-vista--error" role="alert">
      <Icono nombre="alerta" tam={28} />
      <p>{error?.message || 'Ocurrió un error inesperado.'}</p>
      {onReintentar && (
        <button className="boton boton--secundario" onClick={onReintentar}>
          <Icono nombre="recargar" tam={16} /> Reintentar
        </button>
      )}
    </div>
  )
}

export function Vacio({ titulo, texto, icono = 'barco' }) {
  return (
    <div className="estado-vista">
      {ILUSTRACION_POR_ICONO[icono] ? <Ilustracion nombre={ILUSTRACION_POR_ICONO[icono]} className="estado-vista__ilustracion" /> : <Icono nombre={icono} tam={32} />}
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
    </div>
  )
}
