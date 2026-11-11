import { useState } from 'react'
import { abrirVentana, guardarArchivo, mostrarEnVentana } from '../archivos.js'
import Icono from './Icono.jsx'

/**
 * Botón que pide un archivo autenticado al backend (fetch + blob) y lo abre en otra
 * pestaña o lo descarga. El error se muestra con onError.
 */
export default function BotonArchivo({ obtener, abrir = false, children, clase = 'boton boton--secundario', icono = 'documento', onError, disabled }) {
  const [cargando, setCargando] = useState(false)

  const click = async () => {
    onError?.('')
    const ventana = abrir ? abrirVentana() : null
    setCargando(true)
    try {
      const archivo = await obtener()
      if (abrir) mostrarEnVentana(ventana, archivo)
      else guardarArchivo(archivo)
    } catch (err) {
      ventana?.close()
      onError?.(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <button type="button" className={clase} onClick={click} disabled={cargando || disabled}>
      {cargando ? <span className="spinner" /> : <Icono nombre={icono} tam={16} />} {children}
    </button>
  )
}
