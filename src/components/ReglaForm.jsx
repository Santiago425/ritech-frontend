import { useState } from 'react'
import { cumplimientoApi } from '../api/cliente.js'
import { nombreParametro } from './CumplimientoLote.jsx'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

const OPERADORES = ['=', '<>', '<', '<=', '>', '>=']
const CODIGO = /^R-UE-[0-9]{3}$/

/** SCRUM-21: crear o editar una regla normativa de la UE que evalúa el motor de validación. */
export default function ReglaForm({ regla, parametros, siguienteCodigo, onCerrar, onGuardada }) {
  const editando = Boolean(regla)
  const [form, setForm] = useState({
    codigoRegla: regla?.codigoRegla ?? siguienteCodigo,
    normativaReferencia: regla?.normativaReferencia ?? '',
    aplicaTipo: regla?.aplicaTipo ?? 'AMBOS',
    parametro: regla?.parametro ?? '',
    operador: regla?.operador ?? '<=',
    valorLimite: regla?.valorLimite ?? '',
    mensajeError: regla?.mensajeError ?? '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo, transformar = (v) => v) => (e) => {
    setForm((f) => ({ ...f, [campo]: transformar(e.target.value) }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const opciones = { ...parametros, eori_importador_valido: 'EORI valido y pais UE (se evalua en la orden)' }
  if (regla && !opciones[regla.parametro]) opciones[regla.parametro] = 'parametro actual'

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = {}
    if (!CODIGO.test(form.codigoRegla)) er.codigoRegla = 'Formato R-UE-000.'
    if (!form.normativaReferencia.trim()) er.normativaReferencia = 'Indica la norma de referencia.'
    if (!form.parametro) er.parametro = 'Elige qué se evalúa.'
    if (!form.valorLimite.trim()) er.valorLimite = 'Indica el valor límite.'
    else if (form.valorLimite.trim() !== 'true' && Number.isNaN(Number(form.valorLimite))) er.valorLimite = "Debe ser un número o 'true'."
    if (!form.mensajeError.trim()) er.mensajeError = 'Escribe el mensaje que verá el usuario si no cumple.'
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    const cuerpo = {
      ...form,
      normativaReferencia: form.normativaReferencia.trim(),
      valorLimite: form.valorLimite.trim(),
      mensajeError: form.mensajeError.trim(),
      idProducto: null,
      activa: regla?.activa ?? true,
    }
    try {
      const r = editando ? await cumplimientoApi.editarRegla(regla.idRegla, cuerpo) : await cumplimientoApi.crearRegla(cuerpo)
      onGuardada(r, editando)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
      setGuardando(false)
    }
  }

  const error = (c) => errores[c] && <span className="campo__error">{errores[c]}</span>

  return (
    <Modal
      ancho
      titulo={editando ? `Editar regla ${regla.codigoRegla}` : 'Nueva regla normativa'}
      subtitulo="Se aplica en la próxima validación de cada lote"
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando}>
            {guardando ? <span className="spinner spinner--claro" /> : editando ? 'Guardar cambios' : 'Crear regla'}
          </button>
        </>
      }
    >
      <div className="rejilla-campos">
        <label className="campo">
          <span>Código</span>
          <input className="mono" value={form.codigoRegla} onChange={cambiar('codigoRegla', (v) => v.toUpperCase())} maxLength={8} disabled={editando} aria-invalid={!!errores.codigoRegla} />
          {error('codigoRegla')}
          {editando && <span className="campo__nota">El código no se cambia; para otra regla crea una nueva.</span>}
        </label>
        <label className="campo">
          <span>Aplica a</span>
          <select value={form.aplicaTipo} onChange={cambiar('aplicaTipo')}>
            <option value="AMBOS">Café y cacao</option>
            <option value="CAFE">Solo café</option>
            <option value="CACAO">Solo cacao</option>
          </select>
        </label>
      </div>
      <label className="campo">
        <span>Norma de referencia</span>
        <input value={form.normativaReferencia} onChange={cambiar('normativaReferencia')} maxLength={120} placeholder="Reglamento (UE) 2023/915" aria-invalid={!!errores.normativaReferencia} autoFocus={!editando} />
        {error('normativaReferencia')}
      </label>
      <div className="rejilla-regla">
        <label className="campo">
          <span>Qué se evalúa</span>
          <select value={form.parametro} onChange={cambiar('parametro')} aria-invalid={!!errores.parametro}>
            <option value="">Selecciona…</option>
            {Object.entries(opciones).map(([k, desc]) => <option key={k} value={k}>{nombreParametro(k)}</option>)}
          </select>
          {error('parametro')}
          {form.parametro && !errores.parametro && <span className="campo__nota">{opciones[form.parametro]}</span>}
        </label>
        <label className="campo">
          <span>Operador</span>
          <select value={form.operador} onChange={cambiar('operador')} className="mono">
            {OPERADORES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Límite</span>
          <input className="mono" value={form.valorLimite} onChange={cambiar('valorLimite')} maxLength={40} placeholder="5.0 o true" aria-invalid={!!errores.valorLimite} />
          {error('valorLimite')}
        </label>
      </div>
      <label className="campo">
        <span>Mensaje si no cumple</span>
        <textarea rows={2} value={form.mensajeError} onChange={cambiar('mensajeError')} maxLength={300} aria-invalid={!!errores.mensajeError} />
        {error('mensajeError')}
      </label>

      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
