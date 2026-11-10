import { ESTADOS_ENVIO } from '../utils.js'

export default function EstadoBadge({ estado, catalogo = ESTADOS_ENVIO }) {
  const info = catalogo[estado] ?? { etiqueta: estado, tono: 'neutro' }
  return <span className={`badge badge--${info.tono}`}>{info.etiqueta}</span>
}
