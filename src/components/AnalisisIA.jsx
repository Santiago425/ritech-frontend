import { useState } from 'react'
import { iaApi, IA_DISPONIBLE } from '../api/ia.js'
import Icono from './Icono.jsx'

export default function AnalisisIA({ lote, producto, dictamen }) {
  const [estado, setEstado] = useState({ datos: null, error: '', cargando: false })

  if (!IA_DISPONIBLE || !dictamen) return null

  const analizar = async () => {
    setEstado({ datos: null, error: '', cargando: true })
    try {
      setEstado({ datos: await iaApi.analizarLote(lote, producto, dictamen), error: '', cargando: false })
    } catch (err) {
      setEstado({ datos: null, error: err.message, cargando: false })
    }
  }

  const d = estado.datos
  return (
    <div className="analisis-ia">
      {!d && (
        <button className="boton boton--ia" onClick={analizar} disabled={estado.cargando}>
          {estado.cargando ? <span className="spinner spinner--claro" /> : <><Icono nombre="chispa" tam={16} /> Explicar con IA</>}
        </button>
      )}
      {estado.error && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {estado.error}</div>}
      {d && (
        <div className="caja-ia" aria-live="polite">
          <strong><Icono nombre="chispa" tam={16} /> Qué significa y qué hacer</strong>
          <p>{d.explanation}</p>
          {d.steps?.length > 0 && (
            <ol>
              {d.steps.map((paso) => <li key={paso}>{paso}</li>)}
            </ol>
          )}
          <span className="nota-ia">Generado por {d.model}. <button className="enlace-boton" onClick={analizar} disabled={estado.cargando}>Volver a analizar</button></span>
        </div>
      )}
    </div>
  )
}
