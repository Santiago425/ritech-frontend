import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientesApi, ordenesApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import OrdenForm from '../components/OrdenForm.jsx'
import { useCarga } from '../hooks.js'
import { ESTADOS_ORDEN, formatoDinero, formatoFecha } from '../utils.js'

/** SCRUM-25: órdenes de exportación. El cliente UE solo ve las suyas (lo filtra el backend). */
export default function Ordenes() {
  const { esCliente, tienePermiso } = useSesion()
  const puedeGestionar = tienePermiso('ORDENES_GESTIONAR')
  const navigate = useNavigate()

  const [estado, setEstado] = useState('')
  const [idCliente, setIdCliente] = useState('')
  const [nueva, setNueva] = useState(false)

  const ordenes = useCarga(() => ordenesApi.listar({ idCliente }), [idCliente])
  const clientes = useCarga(() => (tienePermiso('CLIENTES_CONSULTAR') ? clientesApi.listar() : Promise.resolve([])))

  const cliente = useMemo(() => {
    const m = new Map((clientes.datos ?? []).map((c) => [c.idCliente, c]))
    return (id) => m.get(id)
  }, [clientes.datos])

  const todas = ordenes.datos ?? []
  const lista = estado ? todas.filter((o) => o.estadoOrden === estado) : todas
  const cuenta = (e) => todas.filter((o) => o.estadoOrden === e).length

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Comercial</span>
          <h1>{esCliente ? 'Mis órdenes' : 'Órdenes de exportación'}</h1>
          <p className="texto-suave">
            {esCliente ? 'Pedidos de café y cacao a nombre de tu empresa.' : 'Pedidos de los importadores con sus lotes asignados, valor y estado.'}
          </p>
        </div>
        {puedeGestionar && (
          <button className="boton boton--primario" onClick={() => setNueva(true)} disabled={!clientes.datos}>
            + Nueva orden
          </button>
        )}
      </header>

      {!ordenes.cargando && !ordenes.error && (
        <div className="fichas-estado" role="tablist" aria-label="Filtrar por estado">
          <button role="tab" aria-selected={!estado} className={`ficha-estado ${!estado ? 'ficha-estado--activa' : ''}`} onClick={() => setEstado('')}>
            <span>Todas</span><strong>{todas.length}</strong>
          </button>
          {Object.entries(ESTADOS_ORDEN).map(([clave, info]) => (
            <button key={clave} role="tab" aria-selected={estado === clave} className={`ficha-estado ficha-estado--${info.tono} ${estado === clave ? 'ficha-estado--activa' : ''}`} onClick={() => setEstado(estado === clave ? '' : clave)}>
              <span>{info.etiqueta}</span><strong>{cuenta(clave)}</strong>
            </button>
          ))}
        </div>
      )}

      <section className="tarjeta">
        {!esCliente && (
          <div className="filtros">
            <div className="filtros__grupo">
              <select className="selector" value={idCliente} onChange={(e) => setIdCliente(e.target.value)} aria-label="Filtrar por cliente" disabled={!clientes.datos?.length}>
                <option value="">Todos los clientes</option>
                {(clientes.datos ?? []).map((c) => <option key={c.idCliente} value={c.idCliente}>{c.razonSocial}</option>)}
              </select>
            </div>
            {!ordenes.cargando && !ordenes.error && (
              <span className="texto-suave contador">{lista.length} {lista.length === 1 ? 'orden' : 'órdenes'}</span>
            )}
          </div>
        )}

        {ordenes.cargando ? (
          <Cargando texto="Cargando órdenes…" />
        ) : ordenes.error ? (
          <ErrorCaja error={ordenes.error} onReintentar={ordenes.recargar} />
        ) : lista.length === 0 ? (
          <Vacio
            icono="documento"
            titulo={estado || idCliente ? 'Sin resultados' : 'Aún no hay órdenes'}
            texto={estado || idCliente ? 'Prueba con otro filtro.' : puedeGestionar ? 'Crea la primera con "Nueva orden".' : null}
          />
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla tabla--compacta">
              <thead>
                <tr>
                  <th>Orden</th>
                  {!esCliente && <th>Cliente</th>}
                  <th>Fecha</th>
                  <th>Incoterm</th>
                  <th className="derecha">Valor total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((o) => {
                  const c = cliente(o.idCliente)
                  return (
                    <tr key={o.idOrden} onClick={() => navigate(`/ordenes/${o.idOrden}`)}>
                      <td data-etiqueta="Orden"><strong className="mono">{o.numeroOrden}</strong></td>
                      {!esCliente && (
                        <td data-etiqueta="Cliente">
                          {c?.razonSocial ?? `Cliente #${o.idCliente}`}
                          {c && <span className="celda-sub">{c.ciudad}</span>}
                        </td>
                      )}
                      <td data-etiqueta="Fecha" className="nowrap">{formatoFecha(o.fechaOrden)}</td>
                      <td data-etiqueta="Incoterm" className="mono">{o.incoterm}</td>
                      <td data-etiqueta="Valor total" className="derecha nowrap">
                        {Number(o.valorTotal) > 0 ? <strong>{formatoDinero(o.valorTotal, o.moneda)}</strong> : <span className="texto-suave">Sin lotes</span>}
                      </td>
                      <td data-etiqueta="Estado"><EstadoBadge estado={o.estadoOrden} catalogo={ESTADOS_ORDEN} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {nueva && (
        <OrdenForm
          clientes={clientes.datos ?? []}
          onCerrar={() => setNueva(false)}
          onGuardada={(o) => navigate(`/ordenes/${o.idOrden}`, { state: { aviso: `Orden ${o.numeroOrden} creada en borrador. Ahora asígnale lotes aprobados.` } })}
        />
      )}
    </div>
  )
}
