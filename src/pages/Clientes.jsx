import { useEffect, useMemo, useState } from 'react'
import { catalogosApi, clientesApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import ClienteForm from '../components/ClienteForm.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import { useCarga } from '../hooks.js'

const POR_PAGINA = 20

function useRetraso(valor, ms = 350) {
  const [v, setV] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return v
}

/** SCRUM-11 y SCRUM-12: registrar, editar, consultar y filtrar clientes importadores de la UE. */
export default function Clientes() {
  const { tienePermiso } = useSesion()
  const puedeGestionar = tienePermiso('CLIENTES_GESTIONAR')

  const [idPais, setIdPais] = useState('')
  const [estado, setEstado] = useState('')
  const [texto, setTexto] = useState('')
  const razonSocial = useRetraso(texto.trim())
  const [pagina, setPagina] = useState(1)
  const [formulario, setFormulario] = useState(null) // null | 'nuevo' | cliente
  const [aviso, setAviso] = useState('')

  const paises = useCarga(() => catalogosApi.paises(true))
  const clientes = useCarga(() => clientesApi.listar({ idPais, estado, razonSocial }), [idPais, estado, razonSocial])

  useEffect(() => setPagina(1), [idPais, estado, razonSocial])

  const nombrePais = useMemo(() => {
    const mapa = new Map((paises.datos ?? []).map((p) => [p.idPais, p]))
    return (id) => mapa.get(id)
  }, [paises.datos])

  const lista = clientes.datos ?? []
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const visibles = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const hayFiltros = idPais || estado || razonSocial

  const alGuardar = (cliente, editado) => {
    setFormulario(null)
    setAviso(editado ? `Se actualizó ${cliente.razonSocial}.` : `${cliente.razonSocial} quedó registrado.`)
    setTimeout(() => setAviso(''), 4000)
    clientes.recargar()
  }

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Comercial</span>
          <h1>Clientes UE</h1>
          <p className="texto-suave">Importadores de la Unión Europea con su EORI y VAT.</p>
        </div>
        {puedeGestionar && (
          <button className="boton boton--primario" onClick={() => setFormulario('nuevo')} disabled={!paises.datos}>
            + Nuevo cliente
          </button>
        )}
      </header>

      {aviso && <div className="aviso aviso--exito" role="status"><Icono nombre="check" tam={16} /> {aviso}</div>}

      <section className="tarjeta">
        <div className="filtros">
          <div className="filtros__grupo">
            <label className="buscador">
              <Icono nombre="buscar" tam={16} />
              <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por razón social" aria-label="Buscar por razón social" />
            </label>
            <select className="selector" value={idPais} onChange={(e) => setIdPais(e.target.value)} aria-label="Filtrar por país">
              <option value="">Todos los países</option>
              {(paises.datos ?? []).map((p) => <option key={p.idPais} value={p.idPais}>{p.nombre}</option>)}
            </select>
            <select className="selector" value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>
          {!clientes.cargando && !clientes.error && (
            <span className="texto-suave contador">{lista.length} {lista.length === 1 ? 'cliente' : 'clientes'}</span>
          )}
        </div>

        {clientes.cargando ? (
          <Cargando texto="Cargando clientes…" />
        ) : clientes.error ? (
          <ErrorCaja error={clientes.error} onReintentar={clientes.recargar} />
        ) : lista.length === 0 ? (
          <Vacio icono="documento" titulo={hayFiltros ? 'Sin resultados' : 'Aún no hay clientes'} texto={hayFiltros ? 'Prueba con otros filtros.' : puedeGestionar ? 'Registra el primer importador con "Nuevo cliente".' : null} />
        ) : (
          <>
            <div className="tabla-contenedor">
              <table className="tabla tabla--compacta">
                <thead>
                  <tr>
                    <th>Razón social</th>
                    <th>EORI</th>
                    <th>País</th>
                    <th>Ciudad</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    {puedeGestionar && <th aria-label="Acciones" />}
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((c) => {
                    const pais = nombrePais(c.idPais)
                    return (
                      <tr key={c.idCliente} className={puedeGestionar ? '' : 'tabla__fila--fija'} onClick={puedeGestionar ? () => setFormulario(c) : undefined}>
                        <td data-etiqueta="Razón social">
                          <strong>{c.razonSocial}</strong>
                          {c.nitVat && <span className="celda-sub mono">VAT {c.nitVat}</span>}
                        </td>
                        <td data-etiqueta="EORI" className="mono">{c.numeroEori}</td>
                        <td data-etiqueta="País" className="nowrap">{pais ? <><span className="iso">{pais.codigoIso2}</span> {pais.nombre}</> : '—'}</td>
                        <td data-etiqueta="Ciudad">{c.ciudad}</td>
                        <td data-etiqueta="Contacto" className="celda-correo"><a href={`mailto:${c.emailContacto}`} onClick={(e) => e.stopPropagation()} className="enlace">{c.emailContacto}</a></td>
                        <td data-etiqueta="Estado">
                          <span className={`badge badge--${c.estado === 'ACTIVO' ? 'exito' : 'neutro'}`}>{c.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</span>
                        </td>
                        {puedeGestionar && (
                          <td className="celda-accion">
                            <button className="boton boton--fantasma" onClick={(e) => { e.stopPropagation(); setFormulario(c) }}>Editar</button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalPaginas > 1 && (
              <nav className="paginacion" aria-label="Paginación">
                <span className="texto-suave">
                  {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, lista.length)} de {lista.length}
                </span>
                <div>
                  <button className="boton boton--secundario" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
                  <span className="paginacion__actual">{pagina} / {totalPaginas}</span>
                  <button className="boton boton--secundario" disabled={pagina === totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>

      {formulario && (
        <ClienteForm
          cliente={formulario === 'nuevo' ? null : formulario}
          paises={paises.datos ?? []}
          onCerrar={() => setFormulario(null)}
          onGuardado={alGuardar}
        />
      )}
    </div>
  )
}
