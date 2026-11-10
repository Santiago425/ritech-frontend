import { ESTADOS_ENVIO, formatoFechaHora } from '../utils.js'
import EstadoBadge from './EstadoBadge.jsx'

/** Bitácora de eventos del envío, del más reciente al más antiguo. */
export default function Bitacora({ eventos }) {
  const ordenados = [...eventos].reverse()
  return (
    <ol className="bitacora">
      {ordenados.map((ev, i) => (
        <li key={ev.idSeguimiento} className={`bitacora__item bitacora__item--${ESTADOS_ENVIO[ev.estado]?.tono ?? 'neutro'} ${i === 0 ? 'bitacora__item--ultimo' : ''}`}>
          <span className="bitacora__punto" />
          <div className="bitacora__cuerpo">
            <div className="bitacora__cabecera">
              <strong>{ev.ubicacion}</strong>
              <EstadoBadge estado={ev.estado} />
            </div>
            <time dateTime={ev.fechaEvento}>{formatoFechaHora(ev.fechaEvento)}</time>
            {ev.observacion && <p>{ev.observacion}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
