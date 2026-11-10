import { useEffect, useRef, useState } from 'react'
import { enviosApi } from '../api/cliente.js'
import { ESTADOS_ENVIO, PASOS_ENVIO } from '../utils.js'
import Icono from './Icono.jsx'

const MAX_UBICACION = 120
const MAX_OBSERVACION = 300

function ahoraLocal() {
  const d = new Date()
  d.setSeconds(0, 0)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function estadoSugerido(actual) {
  const i = PASOS_ENVIO.indexOf(actual)
  return i >= 0 && i < PASOS_ENVIO.length - 1 ? PASOS_ENVIO[i + 1] : 'EN_TRANSITO'
}

/** SCRUM-29: el gestor registra un evento de seguimiento del envío. */
export default function RegistrarEvento({ envio, onCerrar, onRegistrado }) {
  const [form, setForm] = useState({
    estado: estadoSugerido(envio.estadoEnvio),
    ubicacion: '',
    fechaEvento: ahoraLocal(),
    observacion: '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const primerCampo = useRef(null)

  useEffect(() => {
    primerCampo.current?.focus()
    const alTeclear = (e) => e.key === 'Escape' && !enviando && onCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar, enviando])

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const validar = () => {
    const er = {}
    if (!form.ubicacion.trim()) er.ubicacion = 'Escribe dónde está el envío.'
    if (!form.fechaEvento) er.fechaEvento = 'Indica la fecha y hora del evento.'
    else if (new Date(form.fechaEvento) > new Date()) er.fechaEvento = 'La fecha no puede ser futura.'
    if (form.estado === 'INCIDENCIA' && !form.observacion.trim()) er.observacion = 'Describe la incidencia para el cliente.'
    return er
  }

  const enviar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = validar()
    setErrores(er)
    if (Object.keys(er).length) return
    setEnviando(true)
    try {
      const detalle = await enviosApi.registrarEvento(envio.idEnvio, {
        estado: form.estado,
        ubicacion: form.ubicacion.trim(),
        fechaEvento: `${form.fechaEvento}:00`,
        observacion: form.observacion.trim() || undefined,
      })
      onRegistrado(detalle)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-evento" onMouseDown={(e) => e.target === e.currentTarget && !enviando && onCerrar()}>
      <form className="modal__caja" onSubmit={enviar} noValidate>
        <header className="modal__cabecera">
          <div>
            <h2 id="titulo-evento">Registrar evento de seguimiento</h2>
            <p className="texto-suave">{envio.puertoOrigen} → {envio.puertoDestino} · {envio.bookingBl ?? `Envío #${envio.idEnvio}`}</p>
          </div>
          <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar" disabled={enviando}>✕</button>
        </header>

        <div className="modal__cuerpo">
          <fieldset className="campo">
            <legend>Nuevo estado</legend>
            <div className="opciones-estado">
              {Object.entries(ESTADOS_ENVIO).map(([clave, info]) => (
                <label key={clave} className={`opcion-estado opcion-estado--${info.tono} ${form.estado === clave ? 'opcion-estado--activa' : ''}`}>
                  <input type="radio" name="estado" value={clave} checked={form.estado === clave} onChange={cambiar('estado')} />
                  {info.etiqueta}
                </label>
              ))}
            </div>
            {(form.estado === 'EN_TRANSITO' || form.estado === 'ENTREGADO') && (
              <span className="campo__ayuda">
                {form.estado === 'EN_TRANSITO' ? 'La orden de exportación pasará a EN TRÁNSITO.' : 'La orden pasará a ENTREGADA y el envío ya no admitirá más eventos.'}
              </span>
            )}
          </fieldset>

          <label className="campo">
            <span>Ubicación</span>
            <input ref={primerCampo} value={form.ubicacion} onChange={cambiar('ubicacion')} maxLength={MAX_UBICACION} placeholder="Ej. Puerto de Cartagena, Canal de Panamá" aria-invalid={!!errores.ubicacion} />
            {errores.ubicacion && <span className="campo__error">{errores.ubicacion}</span>}
          </label>

          <label className="campo">
            <span>Fecha y hora del evento</span>
            <input type="datetime-local" value={form.fechaEvento} max={ahoraLocal()} onChange={cambiar('fechaEvento')} aria-invalid={!!errores.fechaEvento} />
            {errores.fechaEvento && <span className="campo__error">{errores.fechaEvento}</span>}
          </label>

          <label className="campo">
            <span>
              Observación {form.estado === 'INCIDENCIA' ? '' : <em className="texto-suave">(opcional)</em>}
            </span>
            <textarea rows={3} value={form.observacion} onChange={cambiar('observacion')} maxLength={MAX_OBSERVACION} placeholder="Detalle visible para el cliente" aria-invalid={!!errores.observacion} />
            <span className="campo__pie">
              {errores.observacion ? <span className="campo__error">{errores.observacion}</span> : <span />}
              <span className="texto-suave">{form.observacion.length}/{MAX_OBSERVACION}</span>
            </span>
          </label>

          {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
        </div>

        <footer className="modal__pie">
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button className="boton boton--primario" disabled={enviando}>
            {enviando ? <span className="spinner spinner--claro" /> : 'Registrar evento'}
          </button>
        </footer>
      </form>
    </div>
  )
}
