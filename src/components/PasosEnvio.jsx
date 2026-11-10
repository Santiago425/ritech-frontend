import { ESTADOS_ENVIO, PASOS_ENVIO } from '../utils.js'
import Icono from './Icono.jsx'

/** Progreso del envío. Con INCIDENCIA, se marca el último paso normal registrado en la bitácora. */
export default function PasosEnvio({ estado, seguimiento = [] }) {
  const conIncidencia = estado === 'INCIDENCIA'
  let actual = PASOS_ENVIO.indexOf(estado)
  if (conIncidencia) {
    actual = seguimiento.reduce((max, ev) => Math.max(max, PASOS_ENVIO.indexOf(ev.estado)), 0)
  }

  return (
    <ol className="pasos">
      {PASOS_ENVIO.map((paso, i) => {
        const hecho = i < actual || (i === actual && paso === 'ENTREGADO')
        const esActual = i === actual && !hecho
        const clase = hecho ? 'paso--hecho' : esActual ? (conIncidencia ? 'paso--alerta' : 'paso--actual') : ''
        return (
          <li key={paso} className={`paso ${clase}`}>
            <span className="paso__punto">
              {hecho ? <Icono nombre="check" tam={14} /> : esActual && conIncidencia ? '!' : i + 1}
            </span>
            <span className="paso__texto">{ESTADOS_ENVIO[paso].etiqueta}</span>
          </li>
        )
      })}
    </ol>
  )
}
