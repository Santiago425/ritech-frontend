import { useState } from 'react'
import { iaApi, IA_DISPONIBLE } from '../api/ia.js'
import Icono from './Icono.jsx'

export default function ResumenIA({ tablero, rol }) {
  const [estado, setEstado] = useState({ texto: '', modelo: '', error: '', cargando: false })

  if (!IA_DISPONIBLE) return null

  const generar = async () => {
    setEstado((e) => ({ ...e, cargando: true, error: '' }))
    try {
      const r = await iaApi.resumenTablero(tablero, rol)
      setEstado({ texto: r.summary, modelo: r.model, error: '', cargando: false })
    } catch (err) {
      setEstado((e) => ({ ...e, error: err.message, cargando: false }))
    }
  }

  return (
    <section className="tarjeta tarjeta-ia">
      <div className="tarjeta__cabecera">
        <div>
          <h2><Icono nombre="chispa" tam={18} /> Resumen con IA</h2>
          <p className="texto-suave">Lo más importante de tu operación hoy, en pocas líneas.</p>
        </div>
        <button className="boton boton--ia" onClick={generar} disabled={estado.cargando}>
          {estado.cargando ? <span className="spinner spinner--claro" /> : estado.texto ? 'Actualizar' : 'Generar resumen'}
        </button>
      </div>
      {estado.error && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {estado.error}</div>}
      {estado.texto && (
        <>
          <p className="texto-ia" aria-live="polite">{estado.texto}</p>
          <span className="nota-ia">Generado por {estado.modelo}. Verifica los datos antes de tomar decisiones.</span>
        </>
      )}
    </section>
  )
}
