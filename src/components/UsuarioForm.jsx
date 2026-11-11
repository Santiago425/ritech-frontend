import { useState } from 'react'
import { usuariosApi } from '../api/cliente.js'
import { NOMBRE_ROL } from '../auth/SesionContext.jsx'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** SCRUM-9: crear o editar una cuenta de usuario y asignarle un rol. */
export default function UsuarioForm({ usuario, roles, clientes, cuentas, esUnoMismo, onCerrar, onGuardado }) {
  const editando = Boolean(usuario)
  const [form, setForm] = useState({
    nombreCompleto: usuario?.nombreCompleto ?? '',
    email: usuario?.email ?? '',
    rol: usuario?.rol?.nombreRol ?? '',
    idCliente: usuario?.idCliente ?? '',
    password: '',
    confirmar: '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [verClave, setVerClave] = useState(false)

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const esCliente = form.rol === 'CLIENTE_UE'
  const rolElegido = roles.find((r) => r.nombreRol === form.rol)
  // Un cliente solo puede tener una cuenta de acceso (regla del backend).
  const clientesConCuenta = new Set(cuentas.filter((c) => c.idCliente && c.idUsuario !== usuario?.idUsuario).map((c) => c.idCliente))

  const validar = () => {
    const er = {}
    if (!form.nombreCompleto.trim()) er.nombreCompleto = 'El nombre es obligatorio.'
    if (!form.email.trim()) er.email = 'El correo es obligatorio.'
    else if (!CORREO.test(form.email.trim())) er.email = 'Escribe un correo válido.'
    if (!form.rol) er.rol = 'Asigna un rol.'
    if (esCliente && !form.idCliente) er.idCliente = 'Elige la empresa importadora de esta cuenta.'
    if (!editando || form.password) {
      if (form.password.length < 8 || form.password.length > 72) er.password = 'Debe tener entre 8 y 72 caracteres.'
      else if (form.password !== form.confirmar) er.confirmar = 'Las contraseñas no coinciden.'
    }
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
      nombreCompleto: form.nombreCompleto.trim(),
      email: form.email.trim().toLowerCase(),
      rol: form.rol,
      idCliente: esCliente ? Number(form.idCliente) : null,
      ...(form.password ? { password: form.password } : {}),
    }
    try {
      const guardado = editando ? await usuariosApi.editar(usuario.idUsuario, cuerpo) : await usuariosApi.crear(cuerpo)
      onGuardado(guardado, editando)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
    } finally {
      setGuardando(false)
    }
  }

  const error = (campo) => errores[campo] && <span className="campo__error">{errores[campo]}</span>

  return (
    <Modal
      titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}
      subtitulo={editando ? usuario.email : 'La cuenta queda activa y puede iniciar sesión de inmediato'}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando}>
            {guardando ? <span className="spinner spinner--claro" /> : editando ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </>
      }
    >
      <label className="campo">
        <span>Nombre completo</span>
        <input value={form.nombreCompleto} onChange={cambiar('nombreCompleto')} maxLength={120} autoFocus aria-invalid={!!errores.nombreCompleto} />
        {error('nombreCompleto')}
      </label>
      <label className="campo">
        <span>Correo</span>
        <input type="email" value={form.email} onChange={cambiar('email')} maxLength={120} placeholder="nombre@ritech.co" aria-invalid={!!errores.email} />
        {error('email')}
        {!errores.email && <span className="campo__nota">Es el usuario con el que inicia sesión.</span>}
      </label>

      <fieldset className="campo">
        <legend>Rol</legend>
        <div className="opciones-rol">
          {roles.map((r) => (
            <label key={r.idRol} className={`opcion-rol ${form.rol === r.nombreRol ? 'opcion-rol--activa' : ''} ${esUnoMismo && form.rol !== r.nombreRol ? 'opcion-rol--bloqueada' : ''}`}>
              <input type="radio" name="rol" value={r.nombreRol} checked={form.rol === r.nombreRol} onChange={cambiar('rol')} disabled={esUnoMismo} />
              <strong>{NOMBRE_ROL[r.nombreRol] ?? r.nombreRol}</strong>
              <span>{r.permisos.length} {r.permisos.length === 1 ? "permiso" : "permisos"}</span>
            </label>
          ))}
        </div>
        {error('rol')}
        {esUnoMismo && <span className="campo__nota">No puedes cambiar tu propio rol.</span>}
        {rolElegido && !esUnoMismo && <span className="campo__nota">{rolElegido.descripcion}.</span>}
      </fieldset>

      {esCliente && (
        <label className="campo">
          <span>Empresa importadora</span>
          <select value={form.idCliente} onChange={cambiar('idCliente')} aria-invalid={!!errores.idCliente}>
            <option value="">Selecciona…</option>
            {clientes.map((c) => (
              <option key={c.idCliente} value={c.idCliente} disabled={clientesConCuenta.has(c.idCliente)}>
                {c.razonSocial}{clientesConCuenta.has(c.idCliente) ? ' (ya tiene cuenta)' : ''}
              </option>
            ))}
          </select>
          {error('idCliente')}
          {!errores.idCliente && <span className="campo__nota">El cliente solo verá sus propios lotes y envíos.</span>}
        </label>
      )}

      <div className="rejilla-campos">
        <label className="campo">
          <span>{editando ? 'Nueva contraseña' : 'Contraseña'} {editando && <em className="texto-suave">(opcional)</em>}</span>
          <input type={verClave ? 'text' : 'password'} value={form.password} onChange={cambiar('password')} maxLength={72} autoComplete="new-password" aria-invalid={!!errores.password} />
          {error('password')}
          {!errores.password && <span className="campo__nota">{editando ? 'Déjala vacía para no cambiarla.' : 'Mínimo 8 caracteres.'}</span>}
        </label>
        <label className="campo">
          <span>Confirmar contraseña</span>
          <input type={verClave ? 'text' : 'password'} value={form.confirmar} onChange={cambiar('confirmar')} maxLength={72} autoComplete="new-password" aria-invalid={!!errores.confirmar} />
          {error('confirmar')}
        </label>
      </div>
      <label className="casilla">
        <input type="checkbox" checked={verClave} onChange={(e) => setVerClave(e.target.checked)} /> Mostrar contraseña
      </label>

      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
