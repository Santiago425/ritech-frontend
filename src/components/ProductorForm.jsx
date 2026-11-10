import { useState } from 'react'
import { productoresApi } from '../api/cliente.js'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

const VACIO = { nitOCedula: '', nombre: '', municipio: '', departamento: '', telefono: '' }

export default function ProductorForm({ productor, onCerrar, onGuardado }) {
  const editando = Boolean(productor)
  const [form, setForm] = useState(() => (editando ? Object.fromEntries(Object.keys(VACIO).map((k) => [k, productor[k] ?? ''])) : VACIO))
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = {}
    if (!form.nitOCedula.trim()) er.nitOCedula = 'El NIT o la cédula es obligatorio.'
    else if (!/^[0-9][0-9.-]{4,19}$/.test(form.nitOCedula.trim())) er.nitOCedula = 'Solo números, puntos o guion (ej. 900123456-1).'
    if (!form.nombre.trim()) er.nombre = 'El nombre es obligatorio.'
    if (!form.municipio.trim()) er.municipio = 'El municipio es obligatorio.'
    if (!form.departamento.trim()) er.departamento = 'El departamento es obligatorio.'
    if (form.telefono && !/^[0-9+\s-]{7,25}$/.test(form.telefono.trim())) er.telefono = 'Teléfono no válido.'
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    const cuerpo = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() || null]))
    try {
      const guardado = editando ? await productoresApi.editar(productor.idProductor, cuerpo) : await productoresApi.crear(cuerpo)
      onGuardado(guardado, editando)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
    } finally {
      setGuardando(false)
    }
  }

  const campo = (nombre, etiqueta, input = {}, opcional) => (
    <label className="campo">
      <span>{etiqueta} {opcional && <em className="texto-suave">(opcional)</em>}</span>
      <input value={form[nombre]} onChange={cambiar(nombre)} aria-invalid={!!errores[nombre]} {...input} />
      {errores[nombre] && <span className="campo__error">{errores[nombre]}</span>}
    </label>
  )

  return (
    <Modal
      titulo={editando ? 'Editar productor' : 'Nuevo productor'}
      subtitulo={editando ? productor.nombre : 'Caficultor, cacaotero o asociación proveedora'}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando}>
            {guardando ? <span className="spinner spinner--claro" /> : editando ? 'Guardar cambios' : 'Registrar productor'}
          </button>
        </>
      }
    >
      {campo('nombre', 'Nombre o razón social', { maxLength: 120, autoFocus: true })}
      <div className="rejilla-campos">
        {campo('nitOCedula', 'NIT o cédula', { maxLength: 20, className: 'mono', inputMode: 'numeric' })}
        {campo('telefono', 'Teléfono', { maxLength: 25, inputMode: 'tel' }, true)}
      </div>
      <div className="rejilla-campos">
        {campo('municipio', 'Municipio', { maxLength: 80 })}
        {campo('departamento', 'Departamento', { maxLength: 80, list: 'departamentos' })}
      </div>
      <datalist id="departamentos">
        {['Antioquia', 'Boyacá', 'Caldas', 'Cauca', 'Cesar', 'Cundinamarca', 'Huila', 'Magdalena', 'Nariño', 'Norte de Santander', 'Quindío', 'Risaralda', 'Santander', 'Tolima', 'Valle del Cauca'].map((d) => <option key={d} value={d} />)}
      </datalist>
      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
