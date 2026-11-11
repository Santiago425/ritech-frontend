import { Fragment, useEffect, useMemo, useState } from 'react'
import { auditoriaApi, usuariosApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import { useCarga } from '../hooks.js'
import { formatoFechaHora } from '../utils.js'

const TAMANO = 25

const TABLAS = {
  clientes_ue: 'Clientes UE',
  lotes_exportacion: 'Lotes',
  inspecciones_calidad: 'Inspecciones',
}

const ACCIONES = {
  INSERT: { etiqueta: 'Creación', tono: 'exito' },
  UPDATE: { etiqueta: 'Edición', tono: 'info' },
  DELETE: { etiqueta: 'Eliminación', tono: 'alerta' },
}

const comoObjeto = (v) => {
  if (v == null) return null
  if (typeof v === 'string') {
    try {
      return JSON.parse(v)
    } catch {
      return { valor: v }
    }
  }
  return v
}

const legible = (campo) => campo.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
const texto = (v) => (v == null || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))

/** Resumen corto del cambio para la fila de la tabla. */
function resumen(a, antes, despues) {
  if (a.accion === 'UPDATE' && antes && despues) {
    const cambiados = Object.keys(despues).filter((k) => texto(antes[k]) !== texto(despues[k]))
    if (cambiados.length === 0) return 'Sin cambios en los campos auditados'
    return cambiados.map((k) => `${legible(k)}: ${texto(antes[k])} → ${texto(despues[k])}`).join(' · ')
  }
  const datos = despues ?? antes ?? {}
  const clave = ['razon_social', 'codigo_lote', 'resultado', 'nombre'].find((k) => datos[k] != null)
  return clave ? `${legible(clave)}: ${texto(datos[clave])}` : `${Object.keys(datos).length} campos`
}

/** SCRUM-10: consulta del rastro de auditoría (quién creó, editó o eliminó qué y cuándo). */
export default function Auditoria() {
  const { tienePermiso } = useSesion()
  const [tabla, setTabla] = useState('')
  const [idUsuario, setIdUsuario] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(0)
  const [abierta, setAbierta] = useState(null)

  useEffect(() => setPagina(0), [tabla, idUsuario, desde, hasta])

  const usuarios = useCarga(() => (tienePermiso('USUARIOS_GESTIONAR') ? usuariosApi.listar() : Promise.resolve([])))
  const registros = useCarga(
    () => auditoriaApi.listar({ tabla, idUsuario, desde, hasta, pagina, tamano: TAMANO }),
    [tabla, idUsuario, desde, hasta, pagina],
  )

  const autor = useMemo(() => {
    const m = new Map((usuarios.datos ?? []).map((u) => [u.idUsuario, u]))
    return (id) => m.get(id)
  }, [usuarios.datos])

  const pag = registros.datos
  const filas = pag?.content ?? []
  const total = pag?.totalElements ?? 0
  const totalPaginas = pag?.totalPages ?? 1
  const hayFiltros = tabla || idUsuario || desde || hasta
  const rangoInvalido = desde && hasta && desde > hasta

  const limpiar = () => {
    setTabla('')
    setIdUsuario('')
    setDesde('')
    setHasta('')
  }

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Seguridad</span>
          <h1>Auditoría</h1>
          <p className="texto-suave">Rastro de cada creación, edición y eliminación, con su autor, fecha e IP de origen.</p>
        </div>
      </header>

      <section className="tarjeta">
        <div className="filtros">
          <div className="filtros__grupo">
            <select className="selector" value={tabla} onChange={(e) => setTabla(e.target.value)} aria-label="Filtrar por módulo">
              <option value="">Todos los módulos</option>
              {Object.entries(TABLAS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
            <select className="selector" value={idUsuario} onChange={(e) => setIdUsuario(e.target.value)} aria-label="Filtrar por usuario" disabled={!usuarios.datos?.length}>
              <option value="">Todos los usuarios</option>
              {(usuarios.datos ?? []).map((u) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombreCompleto}</option>)}
            </select>
            <label className="filtro-fecha">
              <span>Desde</span>
              <input type="date" className="selector" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
            </label>
            <label className="filtro-fecha">
              <span>Hasta</span>
              <input type="date" className="selector" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
            </label>
            {hayFiltros && <button className="boton boton--fantasma" onClick={limpiar}>Limpiar filtros</button>}
          </div>
          {!registros.cargando && !registros.error && (
            <span className="texto-suave contador">{total} {total === 1 ? 'registro' : 'registros'}</span>
          )}
        </div>

        {rangoInvalido ? (
          <Vacio icono="calendario" titulo="Rango de fechas inválido" texto='La fecha "desde" debe ser anterior a "hasta".' />
        ) : registros.cargando ? (
          <Cargando texto="Consultando auditoría…" />
        ) : registros.error ? (
          <ErrorCaja error={registros.error} onReintentar={registros.recargar} />
        ) : filas.length === 0 ? (
          <Vacio icono="documento" titulo={hayFiltros ? 'Sin resultados' : 'Aún no hay movimientos'} texto={hayFiltros ? 'Prueba con otros filtros.' : null} />
        ) : (
          <>
            <div className="tabla-contenedor">
              <table className="tabla tabla--compacta">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Módulo</th>
                    <th>Cambio</th>
                    <th aria-label="Detalle" />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((a) => {
                    const antes = comoObjeto(a.valorAnterior)
                    const despues = comoObjeto(a.valorNuevo)
                    const acc = ACCIONES[a.accion] ?? { etiqueta: a.accion, tono: 'neutro' }
                    const u = a.idUsuario ? autor(a.idUsuario) : null
                    const abiertaEsta = abierta === a.idAuditoria
                    return (
                      <Fragment key={a.idAuditoria}>
                        <tr onClick={() => setAbierta(abiertaEsta ? null : a.idAuditoria)} className={abiertaEsta ? 'tabla__fila--abierta' : ''}>
                          <td data-etiqueta="Fecha" className="nowrap">{formatoFechaHora(a.fechaHora)}</td>
                          <td data-etiqueta="Usuario">
                            {u ? u.nombreCompleto : a.idUsuario ? `Usuario #${a.idUsuario}` : <span className="texto-suave">Sistema</span>}
                            {a.ipOrigen && <span className="celda-sub mono">{a.ipOrigen}</span>}
                          </td>
                          <td data-etiqueta="Acción"><span className={`badge badge--${acc.tono}`}>{acc.etiqueta}</span></td>
                          <td data-etiqueta="Módulo" className="nowrap">
                            {TABLAS[a.tablaAfectada] ?? a.tablaAfectada}
                            <span className="celda-sub mono">ID {a.idRegistro}</span>
                          </td>
                          <td data-etiqueta="Cambio" className="celda-resumen">{resumen(a, antes, despues)}</td>
                          <td className="celda-accion">
                            <button className="boton-icono" aria-label={abiertaEsta ? 'Ocultar detalle' : 'Ver detalle'} aria-expanded={abiertaEsta} onClick={(e) => { e.stopPropagation(); setAbierta(abiertaEsta ? null : a.idAuditoria) }}>
                              <span className={`flecha-detalle ${abiertaEsta ? 'flecha-detalle--abierta' : ''}`}><Icono nombre="flecha" tam={16} /></span>
                            </button>
                          </td>
                        </tr>
                        {abiertaEsta && (
                          <tr className="tabla__detalle">
                            <td colSpan={6}><Diferencias antes={antes} despues={despues} /></td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalPaginas > 1 && (
              <nav className="paginacion" aria-label="Paginación">
                <span className="texto-suave">
                  {pagina * TAMANO + 1}–{Math.min((pagina + 1) * TAMANO, total)} de {total}
                </span>
                <div>
                  <button className="boton boton--secundario" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
                  <span className="paginacion__actual">{pagina + 1} / {totalPaginas}</span>
                  <button className="boton boton--secundario" disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function Diferencias({ antes, despues }) {
  const campos = [...new Set([...Object.keys(antes ?? {}), ...Object.keys(despues ?? {})])]
  if (campos.length === 0) return <p className="texto-suave">El registro no guardó valores.</p>
  return (
    <table className="diferencias">
      <thead>
        <tr><th>Campo</th>{antes && <th>Antes</th>}{despues && <th>Después</th>}</tr>
      </thead>
      <tbody>
        {campos.map((c) => {
          const cambio = antes && despues && texto(antes[c]) !== texto(despues[c])
          return (
            <tr key={c} className={cambio ? 'diferencias--cambio' : ''}>
              <td>{legible(c)}</td>
              {antes && <td className="mono diferencias__antes">{texto(antes[c])}</td>}
              {despues && <td className="mono diferencias__despues">{texto(despues[c])}</td>}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
