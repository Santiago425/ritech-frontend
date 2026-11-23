import { ILUSTRACIONES, MINIATURAS } from '../ilustraciones.js'

export default function Ilustracion({ nombre, className = 'pagina__ilustracion' }) {
  const src = ILUSTRACIONES[nombre]
  return src ? <img src={src} alt="" className={className} aria-hidden="true" /> : null
}

export function MiniaturaProducto({ tipo }) {
  return <img src={tipo === 'CACAO' ? MINIATURAS.cacao : MINIATURAS.cafe} alt="" className="miniatura-producto" aria-hidden="true" />
}
