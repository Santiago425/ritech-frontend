import { useState } from 'react'
import { ordenesApi } from '../api/cliente.js'
import { INCOTERMS } from '../utils.js'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

const hoyIso = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** SCRUM-25: crear o editar (en borrador) una orden de exportación. */
export default function OrdenForm({ orden, clientes, tieneLotes = false, onCerrar, onGuardada }) {
  const editando = Boolean(orden)
  const [form, setForm] = useState({
    idCliente: orden?.idCliente ?? '',
    fechaOrden: orden?.fechaOrden ?? hoyIso(),
    incoterm: orden?.incoterm ?? 'FOB',
    moneda: orden?.moneda ?? 'EUR',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  // Solo clientes activos pueden recibir órdenes; al editar se conserva el actual.
  const opciones = clientes.filter((c) => c.estado === 'ACTIVO' || c.idCliente === orden?.idCliente)

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = {}
    if (!form.idCliente) er.idCliente = 'Elige el cliente importador.'
    if (!form.incoterm) er.incoterm = 'Elige el Incoterm.'
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    const cuerpo = { ...form, idCliente: Number(form.idCliente), fechaOrden: form.fechaOrden || null }
    try {
      const guardada = editando ? await ordenesApi.editar(orden.idOrden, cuerpo) : await ordenesApi.crear(cuerpo)
      onGuardada(guardada, editando)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo={editando ? `Editar orden ${orden.numeroOrden}` : 'Nueva orden de exportación'}
      subtitulo={editando ? 'Solo se puede editar mientras está en borrador' : 'Se crea en borrador; después le asignas los lotes aprobados'}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando}>
            {guardando ? <span className="spinner spinner--claro" /> : editando ? 'Guardar cambios' : 'Crear orden'}
          </button>
        </>
      }
    >
      <label className="campo">
        <span>Cliente importador</span>
        <select value={form.idCliente} onChange={cambiar('idCliente')} aria-invalid={!!errores.idCliente} disabled={editando && tieneLotes} autoFocus>
          <option value="">Selecciona…</option>
          {opciones.map((c) => <option key={c.idCliente} value={c.idCliente}>{c.razonSocial} · {c.numeroEori}</option>)}
        </select>
        {errores.idCliente && <span className="campo__error">{errores.idCliente}</span>}
        {editando && tieneLotes && <span className="campo__nota">Retira los lotes de la orden para cambiar el cliente.</span>}
      </label>

      <div className="rejilla-campos">
        <label className="campo">
          <span>Fecha de la orden</span>
          <input type="date" value={form.fechaOrden} onChange={cambiar('fechaOrden')} />
        </label>
        <label className="campo">
          <span>Moneda</span>
          <select value={form.moneda} onChange={cambiar('moneda')}>
            <option value="EUR">EUR · Euro</option>
            <option value="USD">USD · Dólar</option>
          </select>
        </label>
      </div>

      <fieldset className="campo">
        <legend>Incoterm</legend>
        <div className="opciones-incoterm">
          {Object.entries(INCOTERMS).map(([codigo, nombre]) => (
            <label key={codigo} className={`opcion-rol ${form.incoterm === codigo ? 'opcion-rol--activa' : ''}`}>
              <input type="radio" name="incoterm" value={codigo} checked={form.incoterm === codigo} onChange={cambiar('incoterm')} />
              <strong className="mono">{codigo}</strong>
              <span>{nombre}</span>
            </label>
          ))}
        </div>
        {errores.incoterm && <span className="campo__error">{errores.incoterm}</span>}
      </fieldset>

      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
