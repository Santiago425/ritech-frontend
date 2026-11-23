import { FOTO_POR_MODULO, FOTOS } from '../fotos.js'

export default function FotoModulo({ nombre }) {
  const foto = FOTOS[FOTO_POR_MODULO[nombre]]
  if (!foto) return null
  return <div className="pagina__foto" style={{ backgroundImage: `url(${foto(900)})` }} aria-hidden="true" />
}
