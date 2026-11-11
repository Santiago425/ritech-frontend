import { useState } from 'react'
import { cumplimientoApi } from '../api/cliente.js'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

const TIPOS_ARCHIVO = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024

const hoyIso = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const tamano = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`)

/**
 * SCRUM-20: cargar (o renovar) un certificado del lote con su vigencia y, opcionalmente,
 * el soporte digitalizado. Renovar un tipo ya cargado lo reemplaza y vuelve a VIGENTE.
 */
export default function CertificadoForm({ lote, tipos, existentes, inicial, soloSoporte = false, onCerrar, onGuardado }) {
  const [form, setForm] = useState({
    idCertificacion: inicial?.idCertificacion ?? '',
    numeroDocumento: soloSoporte ? inicial?.numeroDocumento ?? '' : '',
    fechaEmision: '',
    fechaVencimiento: '',
  })
  const [archivo, setArchivo] = useState(null)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const tipo = tipos.find((t) => String(t.idCertificacion) === String(form.idCertificacion))
  const yaCargado = existentes.find((c) => String(c.idCertificacion) === String(form.idCertificacion))

  const elegirArchivo = (e) => {
    const f = e.target.files?.[0] ?? null
    setErrores((er) => ({ ...er, archivo: undefined }))
    if (f && !TIPOS_ARCHIVO.includes(f.type)) {
      setErrores((er) => ({ ...er, archivo: 'Debe ser PDF, JPG o PNG.' }))
      setArchivo(null)
      return
    }
    if (f && f.size > MAX_BYTES) {
      setErrores((er) => ({ ...er, archivo: 'El archivo supera 10 MB.' }))
      setArchivo(null)
      return
    }
    setArchivo(f)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = {}
    if (!soloSoporte) {
      if (!form.idCertificacion) er.idCertificacion = 'Elige el tipo de certificado.'
      if (!form.numeroDocumento.trim()) er.numeroDocumento = 'Indica el número del documento.'
      if (!form.fechaEmision) er.fechaEmision = 'Indica la fecha de emisión.'
      else if (form.fechaEmision > hoyIso()) er.fechaEmision = 'La emisión no puede ser futura.'
      if (!form.fechaVencimiento) er.fechaVencimiento = 'Indica la fecha de vencimiento.'
      else if (form.fechaVencimiento <= hoyIso()) er.fechaVencimiento = 'No se puede cargar un certificado ya vencido.'
      else if (form.fechaEmision && form.fechaVencimiento <= form.fechaEmision) er.fechaVencimiento = 'Debe ser posterior a la emisión.'
    } else if (!archivo) {
      er.archivo = 'Elige el archivo del certificado.'
    }
    if (errores.archivo) er.archivo = errores.archivo
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    const idCert = Number(form.idCertificacion)
    try {
      let guardado = null
      if (!soloSoporte) {
        guardado = await cumplimientoApi.cargarCertificado(lote.idLote, {
          idCertificacion: idCert,
          numeroDocumento: form.numeroDocumento.trim(),
          fechaEmision: form.fechaEmision,
          fechaVencimiento: form.fechaVencimiento,
        })
      }
      if (archivo) {
        try {
          guardado = await cumplimientoApi.subirSoporte(lote.idLote, idCert, archivo)
        } catch (err) {
          // El certificado ya quedó guardado; solo falló el adjunto.
          if (!soloSoporte) {
            onGuardado(guardado, `Certificado guardado, pero el soporte no se pudo adjuntar: ${err.message}`)
            return
          }
          throw err
        }
      }
      const nombre = tipo?.nombre ?? 'Certificado'
      onGuardado(guardado, soloSoporte ? `Soporte adjuntado a ${nombre}.` : yaCargado ? `${nombre} renovado.` : `${nombre} cargado.`)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
      setGuardando(false)
    }
  }

  const error = (c) => errores[c] && <span className="campo__error">{errores[c]}</span>

  return (
    <Modal
      titulo={soloSoporte ? 'Adjuntar soporte' : yaCargado ? 'Renovar certificado' : 'Cargar certificado'}
      subtitulo={`Lote ${lote.codigoLote}${soloSoporte && tipo ? ` · ${tipo.nombre}` : ''}`}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando}>
            {guardando ? <span className="spinner spinner--claro" /> : soloSoporte ? 'Adjuntar' : 'Guardar certificado'}
          </button>
        </>
      }
    >
      {!soloSoporte && (
        <>
          <label className="campo">
            <span>Tipo de certificado</span>
            <select value={form.idCertificacion} onChange={cambiar('idCertificacion')} aria-invalid={!!errores.idCertificacion} autoFocus>
              <option value="">Selecciona…</option>
              {tipos.map((t) => (
                <option key={t.idCertificacion} value={t.idCertificacion}>
                  {t.nombre}{t.obligatoriaUe ? ' (obligatorio UE)' : ''}
                </option>
              ))}
            </select>
            {error('idCertificacion')}
            {tipo && !errores.idCertificacion && (
              <span className="campo__nota">
                Emite: {tipo.entidadEmisora}.{yaCargado ? ` Ya hay uno cargado (${yaCargado.numeroDocumento}); este lo reemplaza.` : ''}
              </span>
            )}
          </label>
          <label className="campo">
            <span>Número del documento</span>
            <input className="mono" value={form.numeroDocumento} onChange={cambiar('numeroDocumento')} maxLength={60} placeholder="ICA-FIT-2026-00000" aria-invalid={!!errores.numeroDocumento} />
            {error('numeroDocumento')}
          </label>
          <div className="rejilla-campos">
            <label className="campo">
              <span>Fecha de emisión</span>
              <input type="date" max={hoyIso()} value={form.fechaEmision} onChange={cambiar('fechaEmision')} aria-invalid={!!errores.fechaEmision} />
              {error('fechaEmision')}
            </label>
            <label className="campo">
              <span>Fecha de vencimiento</span>
              <input type="date" min={form.fechaEmision || hoyIso()} value={form.fechaVencimiento} onChange={cambiar('fechaVencimiento')} aria-invalid={!!errores.fechaVencimiento} />
              {error('fechaVencimiento')}
            </label>
          </div>
        </>
      )}

      <label className="campo">
        <span>Soporte digitalizado {!soloSoporte && <em className="texto-suave">(opcional)</em>}</span>
        <label className={`zona-archivo ${archivo ? 'zona-archivo--lleno' : ''}`}>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={elegirArchivo} />
          <Icono nombre="documento" tam={20} />
          {archivo ? (
            <span><strong>{archivo.name}</strong> · {tamano(archivo.size)}</span>
          ) : (
            <span>Elige un PDF, JPG o PNG (máx. 10 MB)</span>
          )}
        </label>
        {error('archivo')}
      </label>

      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
