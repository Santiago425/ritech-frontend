import { avanceRuta, formatoFecha } from '../utils.js'
import Icono from './Icono.jsx'

export default function RutaEnvio({ envio, ubicacionActual }) {
  const avance = avanceRuta(envio)
  const alerta = envio.estadoEnvio === 'INCIDENCIA'

  return (
    <div className="ruta">
      <div className="ruta__extremo">
        <span className="ruta__etiqueta">Origen</span>
        <strong>{envio.puertoOrigen}</strong>
        <span className="ruta__fecha">Zarpe est. {formatoFecha(envio.fechaEstimadaZarpe)}</span>
      </div>

      <div className="ruta__linea" aria-label={`Avance aproximado ${Math.round(avance * 100)}%`}>
        <div className={`ruta__recorrido ${alerta ? 'ruta__recorrido--alerta' : ''}`} style={{ width: `${avance * 100}%` }} />
        <div className={`ruta__buque ${alerta ? 'ruta__buque--alerta' : ''}`} style={{ left: `${avance * 100}%` }}>
          <Icono nombre="barco" tam={18} />
        </div>
        {ubicacionActual && (
          <div className="ruta__ubicacion" style={{ left: `${Math.min(80, Math.max(20, avance * 100))}%` }}>
            <Icono nombre="pin" tam={13} /> {ubicacionActual}
          </div>
        )}
      </div>

      <div className="ruta__extremo ruta__extremo--fin">
        <span className="ruta__etiqueta">Destino</span>
        <strong>{envio.puertoDestino}</strong>
        <span className="ruta__fecha">Arribo est. {formatoFecha(envio.fechaEstimadaArribo)}</span>
      </div>
    </div>
  )
}
