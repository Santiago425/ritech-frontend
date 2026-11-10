import { Link } from 'react-router-dom'
import { Vacio } from '../components/Estados.jsx'

export default function NoEncontrado() {
  return (
    <div className="tarjeta">
      <Vacio titulo="Página no encontrada" texto="La dirección que abriste no existe." icono="alerta" />
      <p className="centrado"><Link to="/" className="boton boton--secundario">Volver al inicio</Link></p>
    </div>
  )
}
