import { useState } from 'react'
import { lotesApi } from '../api/cliente.js'
import { RESULTADOS_INSPECCION } from '../utils.js'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

const MIN_OBS_RECHAZO = 20

function hoy() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const METRICAS = [
  { campo: 'humedadPorcentaje', etiqueta: 'Humedad', unidad: '%', min: 0, max: 100, paso: '0.1' },
  { campo: 'defectosPor300g', etiqueta: 'Defectos', unidad: 'por 300 g', min: 0, paso: '1', entero: true },
  { campo: 'puntajeTaza', etiqueta: 'Puntaje en taza', unidad: 'SCA', min: 0, max: 100, paso: '0.25', soloCafe: true },
  { campo: 'ocratoxinaPpb', etiqueta: 'Ocratoxina A', unidad: 'ppb', min: 0, paso: '0.01' },
  { campo: 'aflatoxinasPpb', etiqueta: 'Aflatoxinas', unidad: 'ppb', min: 0, paso: '0.01' },
]

/** SCRUM-17/18: el inspector registra la inspección y aprueba, condiciona o rechaza el lote. */
export default function InspeccionForm({ lote, esCafe, onCerrar, onRegistrada }) {
  const [form, setForm] = useState({
    resultado: 'APROBADO', fechaInspeccion: hoy(), observaciones: '',
    humedadPorcentaje: '', defectosPor300g: '', puntajeTaza: '', ocratoxinaPpb: '', aflatoxinasPpb: '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const rechazo = form.resultado === 'RECHAZADO'
  const largoObs = form.observaciones.trim().length

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const validar = () => {
    const er = {}
    if (!form.fechaInspeccion) er.fechaInspeccion = 'Indica la fecha.'
    else if (form.fechaInspeccion > hoy()) er.fechaInspeccion = 'La fecha no puede ser futura.'
    for (const m of METRICAS) {
      const v = form[m.campo]
      if (v === '') continue
      const n = Number(v)
      if (Number.isNaN(n) || n < m.min || (m.max != null && n > m.max)) er[m.campo] = m.max != null ? `Entre ${m.min} y ${m.max}.` : 'No puede ser negativo.'
      else if (m.entero && !Number.isInteger(n)) er[m.campo] = 'Debe ser un número entero.'
    }
    if (rechazo && largoObs < MIN_OBS_RECHAZO) er.observaciones = `Para rechazar, explica el motivo (mínimo ${MIN_OBS_RECHAZO} caracteres).`
    return er
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = validar()
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    const cuerpo = { resultado: form.resultado, fechaInspeccion: form.fechaInspeccion, observaciones: form.observaciones.trim() || null }
    for (const m of METRICAS) cuerpo[m.campo] = form[m.campo] === '' ? null : Number(form[m.campo])
    try {
      onRegistrada(await lotesApi.inspeccionar(lote.idLote, cuerpo))
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo="Registrar inspección de calidad"
      subtitulo={`Lote ${lote.codigoLote}`}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className={`boton ${rechazo ? 'boton--peligro' : 'boton--primario'}`} disabled={guardando}>
            {guardando ? <span className="spinner spinner--claro" /> : rechazo ? 'Rechazar lote' : 'Registrar inspección'}
          </button>
        </>
      }
    >
      <fieldset className="campo">
        <legend>Dictamen</legend>
        <div className="opciones-estado">
          {Object.entries(RESULTADOS_INSPECCION).map(([clave, info]) => (
            <label key={clave} className={`opcion-estado opcion-estado--${info.tono} ${form.resultado === clave ? 'opcion-estado--activa' : ''}`}>
              <input type="radio" name="resultado" value={clave} checked={form.resultado === clave} onChange={cambiar('resultado')} />
              {info.etiqueta}
            </label>
          ))}
        </div>
        <span className="campo__nota">
          {form.resultado === 'APROBADO' && 'El lote queda APROBADO y se puede asignar a una orden de exportación.'}
          {form.resultado === 'CONDICIONADO' && 'Queda constancia de la inspección; el estado del lote no cambia.'}
          {rechazo && 'El lote queda RECHAZADO y no podrá asignarse a ninguna orden. El cambio queda auditado.'}
        </span>
      </fieldset>

      <label className="campo">
        <span>Fecha de inspección</span>
        <input type="date" max={hoy()} value={form.fechaInspeccion} onChange={cambiar('fechaInspeccion')} aria-invalid={!!errores.fechaInspeccion} />
        {errores.fechaInspeccion && <span className="campo__error">{errores.fechaInspeccion}</span>}
      </label>

      <div className="rejilla-metricas">
        {METRICAS.filter((m) => !m.soloCafe || esCafe).map((m) => (
          <label key={m.campo} className="campo">
            <span>{m.etiqueta} <em className="texto-suave">({m.unidad})</em></span>
            <input type="number" min={m.min} max={m.max} step={m.paso} value={form[m.campo]} onChange={cambiar(m.campo)} aria-invalid={!!errores[m.campo]} />
            {errores[m.campo] && <span className="campo__error">{errores[m.campo]}</span>}
          </label>
        ))}
      </div>

      <label className="campo">
        <span>Observaciones {rechazo ? '' : <em className="texto-suave">(opcional)</em>}</span>
        <textarea rows={3} maxLength={500} value={form.observaciones} onChange={cambiar('observaciones')} placeholder={rechazo ? 'Motivo del rechazo: defectos encontrados, contaminación, humedad…' : 'Notas de la inspección'} aria-invalid={!!errores.observaciones} />
        <span className="campo__pie">
          {errores.observaciones ? <span className="campo__error">{errores.observaciones}</span> : <span />}
          <span className={rechazo && largoObs < MIN_OBS_RECHAZO ? 'texto-alerta' : 'texto-suave'}>
            {rechazo ? `${largoObs}/${MIN_OBS_RECHAZO} mín.` : `${form.observaciones.length}/500`}
          </span>
        </span>
      </label>

      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
