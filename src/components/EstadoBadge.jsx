import { ESTADOS_ENVIO } from '../utils.js'

export default function EstadoBadge({ estado }) {
  const info = ESTADOS_ENVIO[estado] ?? { etiqueta: estado, tono: 'neutro' }
  return <span className={`badge badge--${info.tono}`}>{info.etiqueta}</span>
}
