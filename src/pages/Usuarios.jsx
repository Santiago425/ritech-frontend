import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { clientesApi, usuariosApi } from '../api/cliente.js'
import { NOMBRE_ROL, useSesion } from '../auth/SesionContext.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import Modal from '../components/Modal.jsx'
import UsuarioForm from '../components/UsuarioForm.jsx'
import { useCarga } from '../hooks.js'
import { formatoFechaHora } from '../utils.js'

const ESTADOS = {
  ACTIVO: { etiqueta: 'Activo', tono: 'exito' },
  INACTIVO: { etiqueta: 'Inactivo', tono: 'neutro' },
  BLOQUEADO: { etiqueta: 'Bloqueado', tono: 'alerta' },
}

const MODULOS = { SEGURIDAD: 'Seguridad', NORMATIVA: 'Normativa UE', COMERCIAL: 'Comercial', MAESTROS: 'Datos maestros', LOTES: 'Lotes', CALIDAD: 'Calidad' }

function iniciales(nombre = '') {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

/** SCRUM-9: gestión de usuarios, asignación de rol y consulta de permisos por rol. */
export default function Usuarios() {
  const { usuario: yo, tienePermiso } = useSesion()
  const [params, setParams] = useSearchParams()
  const pestana = params.get('ver') === 'roles' ? 'roles' : 'usuarios'

  const usuarios = useCarga(() => usuariosApi.listar())
  const roles = useCarga(() => usuariosApi.roles())
  const clientes = useCarga(() => (tienePermiso('CLIENTES_CONSULTAR') ? clientesApi.listar() : Promise.resolve([])))

  const [texto, setTexto] = useState('')
  const [rol, setRol] = useState('')
  const [estado, setEstado] = useState('')
  const [formulario, setFormulario] = useState(null)
  const [cambio, setCambio] = useState(null) // { usuario, estado }
  const [aviso, setAviso] = useState('')

  const lista = usuarios.datos ?? []
  const filtrados = useMemo(() => {
    const t = texto.trim().toLowerCase()
    return lista.filter((u) =>
      (!t || u.nombreCompleto.toLowerCase().includes(t) || u.email.includes(t)) &&
      (!rol || u.rol?.nombreRol === rol) &&
      (!estado || u.estado === estado))
  }, [lista, texto, rol, estado])

  const nombreCliente = useMemo(() => {
    const m = new Map((clientes.datos ?? []).map((c) => [c.idCliente, c.razonSocial]))
    return (id) => m.get(id)
  }, [clientes.datos])

  const avisar = (t) => {
    setAviso(t)
    setTimeout(() => setAviso(''), 4000)
  }

  const alGuardar = (u, editado) => {
    setFormulario(null)
    avisar(editado ? `Se actualizó la cuenta de ${u.nombreCompleto}.` : `La cuenta de ${u.nombreCompleto} quedó creada.`)
    usuarios.recargar()
  }

  const conteo = (r) => lista.filter((u) => u.rol?.nombreRol === r && u.estado === 'ACTIVO').length

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Seguridad</span>
          <h1>Usuarios y roles</h1>
          <p className="texto-suave">Cuentas de acceso a la plataforma y lo que puede hacer cada rol.</p>
        </div>
        {pestana === 'usuarios' && (
          <button className="boton boton--primario" onClick={() => setFormulario('nuevo')} disabled={!roles.datos}>
            + Nuevo usuario
          </button>
        )}
      </header>

      {aviso && <div className="aviso aviso--exito" role="status"><Icono nombre="check" tam={16} /> {aviso}</div>}

      <div className="pestanas" role="tablist">
        <button role="tab" aria-selected={pestana === 'usuarios'} className={pestana === 'usuarios' ? 'activa' : ''} onClick={() => setParams({})}>
          Usuarios {usuarios.datos && <span className="pestanas__num">{lista.length}</span>}
        </button>
        <button role="tab" aria-selected={pestana === 'roles'} className={pestana === 'roles' ? 'activa' : ''} onClick={() => setParams({ ver: 'roles' })}>
          Roles y permisos
        </button>
      </div>

      {pestana === 'roles' ? (
        <MatrizPermisos roles={roles} conteo={usuarios.datos ? conteo : null} />
      ) : (
        <section className="tarjeta">
          <div className="filtros">
            <div className="filtros__grupo">
              <label className="buscador">
                <Icono nombre="buscar" tam={16} />
                <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nombre o correo" aria-label="Buscar por nombre o correo" />
              </label>
              <select className="selector" value={rol} onChange={(e) => setRol(e.target.value)} aria-label="Filtrar por rol">
                <option value="">Todos los roles</option>
                {(roles.datos ?? []).map((r) => <option key={r.idRol} value={r.nombreRol}>{NOMBRE_ROL[r.nombreRol] ?? r.nombreRol}</option>)}
              </select>
              <select className="selector" value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
                <option value="">Todos los estados</option>
                {Object.entries(ESTADOS).map(([v, e]) => <option key={v} value={v}>{e.etiqueta}</option>)}
              </select>
            </div>
            {!usuarios.cargando && !usuarios.error && (
              <span className="texto-suave contador">{filtrados.length} {filtrados.length === 1 ? 'usuario' : 'usuarios'}</span>
            )}
          </div>

          {usuarios.cargando ? (
            <Cargando texto="Cargando usuarios…" />
          ) : usuarios.error ? (
            <ErrorCaja error={usuarios.error} onReintentar={usuarios.recargar} />
          ) : filtrados.length === 0 ? (
            <Vacio icono="usuarios" titulo="Sin resultados" texto="Prueba con otros filtros." />
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla tabla--compacta">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Último acceso</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((u) => {
                    const est = ESTADOS[u.estado] ?? { etiqueta: u.estado, tono: 'neutro' }
                    const esYo = u.idUsuario === yo.idUsuario
                    return (
                      <tr key={u.idUsuario} onClick={() => setFormulario(u)}>
                        <td data-etiqueta="Usuario">
                          <div className="celda-persona">
                            <span className={`avatar avatar--chico ${u.estado !== 'ACTIVO' ? 'avatar--apagado' : ''}`}>{iniciales(u.nombreCompleto)}</span>
                            <div>
                              <strong>{u.nombreCompleto}</strong> {esYo && <span className="badge badge--info">Tú</span>}
                              <span className="celda-sub">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td data-etiqueta="Rol">
                          {NOMBRE_ROL[u.rol?.nombreRol] ?? u.rol?.nombreRol}
                          {u.idCliente && <span className="celda-sub">{nombreCliente(u.idCliente) ?? `Cliente #${u.idCliente}`}</span>}
                        </td>
                        <td data-etiqueta="Estado"><span className={`badge badge--${est.tono}`}>{est.etiqueta}</span></td>
                        <td data-etiqueta="Último acceso" className="nowrap">{u.ultimoAcceso ? formatoFechaHora(u.ultimoAcceso) : <span className="texto-suave">Nunca</span>}</td>
                        <td className="celda-accion">
                          <button className="boton boton--fantasma" onClick={(e) => { e.stopPropagation(); setFormulario(u) }}>Editar</button>
                          {!esYo && (
                            <button
                              className="boton boton--fantasma"
                              onClick={(e) => { e.stopPropagation(); setCambio({ usuario: u, estado: u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' }) }}
                            >
                              {u.estado === 'ACTIVO' ? 'Inactivar' : u.estado === 'BLOQUEADO' ? 'Desbloquear' : 'Activar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {formulario && roles.datos && (
        <UsuarioForm
          usuario={formulario === 'nuevo' ? null : formulario}
          roles={roles.datos}
          clientes={(clientes.datos ?? []).filter((c) => c.estado === 'ACTIVO' || c.idCliente === formulario?.idCliente)}
          cuentas={lista}
          esUnoMismo={formulario !== 'nuevo' && formulario.idUsuario === yo.idUsuario}
          onCerrar={() => setFormulario(null)}
          onGuardado={alGuardar}
        />
      )}

      {cambio && (
        <CambioEstado
          {...cambio}
          onCerrar={() => setCambio(null)}
          onHecho={(u) => {
            setCambio(null)
            avisar(u.estado === 'ACTIVO' ? `${u.nombreCompleto} puede volver a iniciar sesión.` : `${u.nombreCompleto} ya no puede iniciar sesión.`)
            usuarios.recargar()
          }}
        />
      )}
    </div>
  )
}

function CambioEstado({ usuario, estado, onCerrar, onHecho }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const activar = estado === 'ACTIVO'

  const confirmar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      onHecho(await usuariosApi.cambiarEstado(usuario.idUsuario, estado))
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <Modal
      titulo={activar ? 'Activar cuenta' : 'Inactivar cuenta'}
      subtitulo={usuario.nombreCompleto}
      onCerrar={onCerrar}
      bloqueado={enviando}
      onSubmit={confirmar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button className={`boton ${activar ? 'boton--primario' : 'boton--peligro'}`} disabled={enviando}>
            {enviando ? <span className="spinner spinner--claro" /> : activar ? 'Activar' : 'Inactivar'}
          </button>
        </>
      }
    >
      <p>
        {activar
          ? `${usuario.email} podrá volver a iniciar sesión con su contraseña actual.`
          : `${usuario.email} no podrá iniciar sesión. Su historial (lotes, inspecciones y auditoría) se conserva, por eso las cuentas no se eliminan.`}
      </p>
      {error && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {error}</div>}
    </Modal>
  )
}

function MatrizPermisos({ roles, conteo }) {
  if (roles.cargando) return <section className="tarjeta"><Cargando texto="Cargando roles…" /></section>
  if (roles.error) return <section className="tarjeta"><ErrorCaja error={roles.error} onReintentar={roles.recargar} /></section>

  const lista = roles.datos
  const permisos = new Map()
  lista.forEach((r) => r.permisos.forEach((p) => permisos.set(p.codigo, p)))
  const porModulo = [...permisos.values()].reduce((acc, p) => {
    ;(acc[p.modulo] ??= []).push(p)
    return acc
  }, {})

  return (
    <>
      <div className="rejilla-roles">
        {lista.map((r) => (
          <article key={r.idRol} className="tarjeta tarjeta-rol">
            <h3>{NOMBRE_ROL[r.nombreRol] ?? r.nombreRol}</h3>
            <p className="texto-suave">{r.descripcion}.</p>
            <div className="tarjeta-rol__datos">
              <span><strong>{r.permisos.length}</strong> {r.permisos.length === 1 ? "permiso" : "permisos"}</span>
              {conteo && <span><strong>{conteo(r.nombreRol)}</strong> {conteo(r.nombreRol) === 1 ? "usuario activo" : "usuarios activos"}</span>}
            </div>
          </article>
        ))}
      </div>

      <section className="tarjeta">
        <div className="tabla-contenedor">
          <table className="tabla tabla--compacta matriz">
            <thead>
              <tr>
                <th>Permiso</th>
                {lista.map((r) => <th key={r.idRol} className="matriz__rol">{NOMBRE_ROL[r.nombreRol] ?? r.nombreRol}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(porModulo).map(([modulo, ps]) => [
                <tr key={modulo} className="matriz__modulo"><td colSpan={lista.length + 1}>{MODULOS[modulo] ?? modulo}</td></tr>,
                ...ps.map((p) => (
                  <tr key={p.codigo} className="tabla__fila--fija">
                    <td>
                      {p.descripcion}
                      <span className="celda-sub mono">{p.codigo}</span>
                    </td>
                    {lista.map((r) => {
                      const tiene = r.permisos.some((x) => x.codigo === p.codigo)
                      return (
                        <td key={r.idRol} className="matriz__celda" aria-label={tiene ? 'Sí' : 'No'}>
                          {tiene ? <span className="matriz__si"><Icono nombre="check" tam={14} /></span> : <span className="matriz__no">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
        <p className="texto-suave nota-pie">Los permisos de cada rol se definen en la base de datos y el backend los aplica en cada petición.</p>
      </section>
    </>
  )
}
