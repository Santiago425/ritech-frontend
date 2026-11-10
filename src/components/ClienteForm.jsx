import { useState } from 'react'
import { clientesApi } from '../api/cliente.js'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

// Mismo patrón que valida el backend (ClienteSolicitud).
const EORI = /^[A-Z]{2}[A-Za-z0-9]{12,15}$/
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const VACIO = { razonSocial: '', numeroEori: '', nitVat: '', idPais: '', ciudad: '', direccion: '', emailContacto: '', estado: 'ACTIVO' }

/** SCRUM-11: registrar o editar un cliente importador de la UE. */
export default function ClienteForm({ cliente, paises, onCerrar, onGuardado }) {
  const editando = Boolean(cliente)
  const [form, setForm] = useState(() =>
    editando ? Object.fromEntries(Object.keys(VACIO).map((k) => [k, cliente[k] ?? ''])) : VACIO,
  )
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo, transformar = (v) => v) => (e) => {
    setForm((f) => ({ ...f, [campo]: transformar(e.target.value) }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const paisEori = form.numeroEori.slice(0, 2)
  const paisElegido = paises.find((p) => String(p.idPais) === String(form.idPais))

  const validar = () => {
    const er = {}
    if (!form.razonSocial.trim()) er.razonSocial = 'La razón social es obligatoria.'
    if (!form.numeroEori) er.numeroEori = 'El EORI es obligatorio.'
    else if (!EORI.test(form.numeroEori)) er.numeroEori = 'Dos letras del país y 12 a 15 caracteres alfanuméricos.'
    if (!form.idPais) er.idPais = 'Selecciona el país.'
    if (!form.ciudad.trim()) er.ciudad = 'La ciudad es obligatoria.'
    if (!form.emailContacto.trim()) er.emailContacto = 'El correo es obligatorio.'
    else if (!CORREO.test(form.emailContacto.trim())) er.emailContacto = 'Escribe un correo válido.'
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
      ...form,
      razonSocial: form.razonSocial.trim(),
      ciudad: form.ciudad.trim(),
      emailContacto: form.emailContacto.trim(),
      nitVat: form.nitVat.trim() || null,
      direccion: form.direccion.trim() || null,
      idPais: Number(form.idPais),
    }
    try {
      const guardado = editando ? await clientesApi.editar(cliente.idCliente, cuerpo) : await clientesApi.crear(cuerpo)
      onGuardado(guardado, editando)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
    } finally {
      setGuardando(false)
    }
  }

  const campo = (nombre, etiqueta, props = {}, opcional = false) => (
    <label className="campo">
      <span>{etiqueta} {opcional && <em className="texto-suave">(opcional)</em>}</span>
      <input value={form[nombre]} onChange={cambiar(nombre, props.transformar)} aria-invalid={!!errores[nombre]} {...props.input} />
      {errores[nombre] && <span className="campo__error">{errores[nombre]}</span>}
      {props.ayuda && !errores[nombre] && <span className="campo__nota">{props.ayuda}</span>}
    </label>
  )

  return (
    <Modal
      titulo={editando ? 'Editar cliente' : 'Nuevo cliente importador'}
      subtitulo={editando ? cliente.razonSocial : 'Importador de un país miembro de la Unión Europea'}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando}>
            {guardando ? <span className="spinner spinner--claro" /> : editando ? 'Guardar cambios' : 'Registrar cliente'}
          </button>
        </>
      }
    >
      {campo('razonSocial', 'Razón social', { input: { maxLength: 160, autoFocus: true, placeholder: 'Ej. Kaffeehaus Import GmbH' } })}
      <div className="rejilla-campos">
        {campo('numeroEori', 'Número EORI', {
          transformar: (v) => v.replace(/\s/g, '').replace(/^[a-z]{1,2}/, (m) => m.toUpperCase()),
          input: { maxLength: 17, className: 'mono', placeholder: 'DE123456789012' },
          ayuda: paisElegido && paisEori.length === 2 && paisEori !== paisElegido.codigoIso2
            ? `Ojo: el EORI empieza por ${paisEori} y el país es ${paisElegido.codigoIso2}.`
            : 'Único por cliente. Ej. DE123456789012',
        })}
        {campo('nitVat', 'NIT / VAT', { input: { maxLength: 25, className: 'mono' } }, true)}
      </div>
      <div className="rejilla-campos">
        <label className="campo">
          <span>País (UE)</span>
          <select value={form.idPais} onChange={cambiar('idPais')} aria-invalid={!!errores.idPais}>
            <option value="">Selecciona…</option>
            {paises.map((p) => <option key={p.idPais} value={p.idPais}>{p.nombre}</option>)}
          </select>
          {errores.idPais && <span className="campo__error">{errores.idPais}</span>}
        </label>
        {campo('ciudad', 'Ciudad', { input: { maxLength: 80 } })}
      </div>
      {campo('direccion', 'Dirección', { input: { maxLength: 200 } }, true)}
      {campo('emailContacto', 'Correo de contacto', { input: { type: 'email', maxLength: 120, placeholder: 'compras@empresa.eu' } })}

      {editando && (
        <fieldset className="campo">
          <legend>Estado</legend>
          <div className="opciones-estado">
            {[['ACTIVO', 'Activo', 'exito'], ['INACTIVO', 'Inactivo', 'neutro']].map(([v, t, tono]) => (
              <label key={v} className={`opcion-estado opcion-estado--${tono} ${form.estado === v ? 'opcion-estado--activa' : ''}`}>
                <input type="radio" name="estado" value={v} checked={form.estado === v} onChange={cambiar('estado')} />
                {t}
              </label>
            ))}
          </div>
          <span className="campo__nota">Los clientes no se eliminan: se inactivan para conservar sus órdenes.</span>
        </fieldset>
      )}

      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
