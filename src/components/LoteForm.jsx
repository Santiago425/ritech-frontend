import { useState } from 'react'
import { lotesApi } from '../api/cliente.js'
import { formatoKg } from '../utils.js'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

const CODIGO = /^[A-Z0-9-]{3,30}$/

const hoyIso = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** SCRUM-15: registrar o editar (mientras está REGISTRADO) un lote de exportación. */
export default function LoteForm({ lote, productos, tieneOrigen = false, onCerrar, onGuardado }) {
  const editando = Boolean(lote)
  const [form, setForm] = useState({
    idProducto: lote?.idProducto ?? '',
    codigoLote: lote?.codigoLote ?? '',
    pesoNetoKg: lote?.pesoNetoKg ?? '',
    pesoBrutoKg: lote?.pesoBrutoKg ?? '',
    fechaCosecha: lote?.fechaCosecha ?? '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo, transformar = (v) => v) => (e) => {
    setForm((f) => ({ ...f, [campo]: transformar(e.target.value) }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const producto = productos.find((p) => String(p.idProducto) === String(form.idProducto))
  const prefijo = producto ? `${producto.tipo === 'CAFE' ? 'CAF' : 'CAC'}-${new Date().getFullYear()}-` : null
  const neto = Number(form.pesoNetoKg)
  const bruto = Number(form.pesoBrutoKg)
  const tara = neto > 0 && bruto >= neto ? bruto - neto : null

  const validar = () => {
    const er = {}
    if (!form.idProducto) er.idProducto = 'Elige el producto.'
    if (form.codigoLote && !CODIGO.test(form.codigoLote)) er.codigoLote = 'Solo mayúsculas, dígitos y guiones (3 a 30).'
    if (!(neto > 0)) er.pesoNetoKg = 'Indica el peso neto.'
    if (!(bruto > 0)) er.pesoBrutoKg = 'Indica el peso bruto.'
    else if (neto > 0 && bruto < neto) er.pesoBrutoKg = 'El peso bruto no puede ser menor que el neto.'
    if (!form.fechaCosecha) er.fechaCosecha = 'Indica la fecha de cosecha.'
    else if (form.fechaCosecha > hoyIso()) er.fechaCosecha = 'La cosecha no puede ser una fecha futura.'
    return er
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = validar()
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    const cuerpo = {
      idProducto: Number(form.idProducto),
      codigoLote: form.codigoLote.trim() || null,
      pesoNetoKg: neto,
      pesoBrutoKg: bruto,
      fechaCosecha: form.fechaCosecha,
    }
    try {
      const guardado = editando ? await lotesApi.editar(lote.idLote, cuerpo) : await lotesApi.crear(cuerpo)
      onGuardado(guardado, editando)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
    } finally {
      setGuardando(false)
    }
  }

  const error = (c) => errores[c] && <span className="campo__error">{errores[c]}</span>

  return (
    <Modal
      titulo={editando ? `Editar lote ${lote.codigoLote}` : 'Registrar lote de exportación'}
      subtitulo={editando ? 'Solo se puede editar mientras está registrado' : 'Queda registrado y listo para asociar sus fincas de origen e inspeccionar'}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando}>
            {guardando ? <span className="spinner spinner--claro" /> : editando ? 'Guardar cambios' : 'Registrar lote'}
          </button>
        </>
      }
    >
      <label className="campo">
        <span>Producto</span>
        <select value={form.idProducto} onChange={cambiar('idProducto')} aria-invalid={!!errores.idProducto} autoFocus>
          <option value="">Selecciona…</option>
          {productos.map((p) => (
            <option key={p.idProducto} value={p.idProducto}>
              {p.nombreComercial}{p.variedad ? ` · ${p.variedad}` : ''} · HS {p.codigoHs}
            </option>
          ))}
        </select>
        {error('idProducto')}
      </label>

      <label className="campo">
        <span>Código del lote <em className="texto-suave">(opcional)</em></span>
        <input className="mono" value={form.codigoLote} onChange={cambiar('codigoLote', (v) => v.toUpperCase().replace(/\s/g, ''))} maxLength={30} placeholder={prefijo ? `${prefijo}0001` : 'Se genera automáticamente'} aria-invalid={!!errores.codigoLote} />
        {error('codigoLote')}
        {!errores.codigoLote && !editando && <span className="campo__nota">Si lo dejas vacío se genera {prefijo ? `con el formato ${prefijo}NNNN` : 'automáticamente (CAF- para café, CAC- para cacao)'}.</span>}
      </label>

      <div className="rejilla-campos">
        <label className="campo">
          <span>Peso neto (kg)</span>
          <input type="number" min="0.01" step="0.01" value={form.pesoNetoKg} onChange={cambiar('pesoNetoKg')} aria-invalid={!!errores.pesoNetoKg} disabled={editando && tieneOrigen} />
          {error('pesoNetoKg')}
          {editando && tieneOrigen && <span className="campo__nota">Retira las fincas de origen para cambiar el peso neto.</span>}
        </label>
        <label className="campo">
          <span>Peso bruto (kg)</span>
          <input type="number" min="0.01" step="0.01" value={form.pesoBrutoKg} onChange={cambiar('pesoBrutoKg')} aria-invalid={!!errores.pesoBrutoKg} />
          {error('pesoBrutoKg')}
          {!errores.pesoBrutoKg && tara !== null && <span className="campo__nota">Empaque: {formatoKg(tara)}</span>}
        </label>
      </div>

      <label className="campo">
        <span>Fecha de cosecha</span>
        <input type="date" max={hoyIso()} value={form.fechaCosecha} onChange={cambiar('fechaCosecha')} aria-invalid={!!errores.fechaCosecha} />
        {error('fechaCosecha')}
      </label>

      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
