import { useState } from 'react'
import { ordenesApi } from '../api/cliente.js'
import { formatoDinero, formatoKg } from '../utils.js'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

/**
 * SCRUM-26: asignar un lote APROBADO a la orden (o editar kg y precio de uno ya asignado).
 * El backend revalida la normativa UE del lote antes de aceptarlo.
 */
export default function AsignarLote({ orden, disponibles, producto, asignacion, lote, onCerrar, onHecho }) {
  const editando = Boolean(asignacion)
  const [idLote, setIdLote] = useState(asignacion?.idLote ?? '')
  const elegido = editando ? lote : disponibles.find((l) => String(l.idLote) === String(idLote))
  const [kg, setKg] = useState(asignacion ? String(asignacion.kgAsignados) : '')
  const [precio, setPrecio] = useState(asignacion ? String(asignacion.precioUnitario) : '')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const elegir = (e) => {
    setIdLote(e.target.value)
    const l = disponibles.find((x) => String(x.idLote) === e.target.value)
    setKg(l ? String(l.pesoNetoKg) : '')
    setErrores({})
  }

  const kgNum = Number(kg)
  const precioNum = Number(precio)
  const subtotal = kgNum > 0 && precioNum > 0 ? kgNum * precioNum : null

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = {}
    if (!elegido) er.idLote = 'Elige un lote aprobado.'
    if (!(kgNum > 0)) er.kgAsignados = 'Indica los kg a exportar.'
    else if (elegido && kgNum > Number(elegido.pesoNetoKg)) er.kgAsignados = `El lote solo tiene ${formatoKg(elegido.pesoNetoKg)}.`
    if (!(precioNum > 0)) er.precioUnitario = 'Indica el precio por kg.'
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    try {
      const detalle = editando
        ? await ordenesApi.editarLote(orden.idOrden, asignacion.idLote, { kgAsignados: kgNum, precioUnitario: precioNum })
        : await ordenesApi.asignarLote(orden.idOrden, { idLote: elegido.idLote, kgAsignados: kgNum, precioUnitario: precioNum })
      onHecho(detalle, editando ? `Se actualizó el lote ${elegido.codigoLote}.` : `Lote ${elegido.codigoLote} asignado a la orden.`)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
    } finally {
      setGuardando(false)
    }
  }

  const prod = elegido ? producto(elegido.idProducto) : null

  return (
    <Modal
      titulo={editando ? `Editar lote ${lote?.codigoLote ?? ''}` : 'Asignar lote a la orden'}
      subtitulo={`Orden ${orden.numeroOrden} · precios en ${orden.moneda}`}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando || (!editando && disponibles.length === 0)}>
            {guardando ? <span className="spinner spinner--claro" /> : editando ? 'Guardar cambios' : 'Asignar lote'}
          </button>
        </>
      }
    >
      {!editando && (
        disponibles.length === 0 ? (
          <div className="aviso aviso--alerta" role="status">
            <Icono nombre="alerta" tam={16} /> No hay lotes aprobados disponibles. Un lote queda disponible cuando el inspector lo aprueba.
          </div>
        ) : (
          <label className="campo">
            <span>Lote aprobado</span>
            <select value={idLote} onChange={elegir} aria-invalid={!!errores.idLote} autoFocus>
              <option value="">Selecciona…</option>
              {disponibles.map((l) => (
                <option key={l.idLote} value={l.idLote}>
                  {l.codigoLote} · {producto(l.idProducto)?.nombreComercial ?? 'Producto'} · {formatoKg(l.pesoNetoKg)}
                </option>
              ))}
            </select>
            {errores.idLote && <span className="campo__error">{errores.idLote}</span>}
            {!errores.idLote && <span className="campo__nota">Solo aparecen lotes aprobados por calidad que no están en otra orden.</span>}
          </label>
        )
      )}

      {elegido && (
        <div className="resumen-lote">
          <div><span>Producto</span><strong>{prod?.nombreComercial ?? '—'}</strong></div>
          <div><span>Código HS</span><strong className="mono">{prod?.codigoHs ?? '—'}</strong></div>
          <div><span>Peso neto del lote</span><strong>{formatoKg(elegido.pesoNetoKg)}</strong></div>
        </div>
      )}

      <div className="rejilla-campos">
        <label className="campo">
          <span>Kg a exportar</span>
          <input type="number" min="0.01" step="0.01" max={elegido?.pesoNetoKg} value={kg} onChange={(e) => { setKg(e.target.value); setErrores((x) => ({ ...x, kgAsignados: undefined })) }} aria-invalid={!!errores.kgAsignados} />
          {errores.kgAsignados && <span className="campo__error">{errores.kgAsignados}</span>}
          {!errores.kgAsignados && elegido && <span className="campo__nota">Por defecto, todo el lote.</span>}
        </label>
        <label className="campo">
          <span>Precio por kg ({orden.moneda})</span>
          <input type="number" min="0.0001" step="0.0001" value={precio} onChange={(e) => { setPrecio(e.target.value); setErrores((x) => ({ ...x, precioUnitario: undefined })) }} aria-invalid={!!errores.precioUnitario} placeholder="Ej. 6.85" autoFocus={editando} />
          {errores.precioUnitario && <span className="campo__error">{errores.precioUnitario}</span>}
        </label>
      </div>

      {subtotal && (
        <p className="subtotal-linea">Subtotal del lote: <strong>{formatoDinero(subtotal, orden.moneda)}</strong></p>
      )}
      {!editando && (
        <p className="campo__nota">Al asignar, el sistema vuelve a validar el lote contra las reglas de la UE (EUDR, certificados vigentes y última inspección).</p>
      )}

      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
