import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { enviosApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import { useCarga } from '../hooks.js'
import { ESTADOS_ENVIO, formatoFecha, resumenArribo } from '../utils.js'

export default function Envios() {
  const { esCliente } = useSesion()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const estado = params.get('estado') ?? ''
  const [busqueda, setBusqueda] = useState('')
  const { datos, error, cargando, recargar } = useCarga(() => enviosApi.listar(estado), [estado])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!datos || !q) return datos ?? []
    return datos.filter((e) =>
      [e.numeroContenedor, e.bookingBl, e.puertoOrigen, e.puertoDestino, String(e.idEnvio)]
        .some((v) => v?.toLowerCase().includes(q)),
    )
  }, [datos, busqueda])

  const cambiarEstado = (valor) => setParams(valor ? { estado: valor } : {})

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Logística</span>
          <h1>{esCliente ? 'Mis envíos' : 'Envíos'}</h1>
          <p className="texto-suave">
            {esCliente ? 'Consulta el estado y la ubicación de los envíos de tus órdenes.' : 'Estado y ubicación de todos los envíos programados.'}
          </p>
        </div>
      </header>

      <section className="tarjeta">
        <div className="filtros">
          <div className="filtros__chips" role="tablist" aria-label="Filtrar por estado">
            <button className={`chip ${estado === '' ? 'chip--activo' : ''}`} onClick={() => cambiarEstado('')}>Todos</button>
            {Object.entries(ESTADOS_ENVIO).map(([clave, info]) => (
              <button key={clave} className={`chip ${estado === clave ? 'chip--activo' : ''}`} onClick={() => cambiarEstado(clave)}>
                {info.etiqueta}
              </button>
            ))}
          </div>
          <label className="buscador">
            <Icono nombre="buscar" tam={16} />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Contenedor, booking o puerto" aria-label="Buscar envío" />
          </label>
        </div>

        {cargando ? (
          <Cargando texto="Cargando envíos…" />
        ) : error ? (
          <ErrorCaja error={error} onReintentar={recargar} />
        ) : filtrados.length === 0 ? (
          <Vacio titulo="No hay envíos" texto={busqueda || estado ? 'Prueba con otro filtro o búsqueda.' : 'Cuando se programe un envío aparecerá aquí.'} />
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Envío</th>
                  <th>Ruta</th>
                  <th>Contenedor</th>
                  <th>Zarpe est.</th>
                  <th>Arribo est.</th>
                  <th>Estado</th>
                  <th aria-label="Abrir" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((e) => {
                  const arribo = resumenArribo(e)
                  return (
                    <tr key={e.idEnvio} onClick={() => navigate(`/envios/${e.idEnvio}`)}>
                      <td data-etiqueta="Envío">
                        <strong>{e.bookingBl ?? `#${e.idEnvio}`}</strong>
                        <span className="celda-sub">Envío #{e.idEnvio}</span>
                      </td>
                      <td data-etiqueta="Ruta">{e.puertoOrigen} → {e.puertoDestino}</td>
                      <td data-etiqueta="Contenedor" className="mono">{e.numeroContenedor ?? '—'}</td>
                      <td data-etiqueta="Zarpe est.">{formatoFecha(e.fechaEstimadaZarpe)}</td>
                      <td data-etiqueta="Arribo est.">
                        {formatoFecha(e.fechaEstimadaArribo)}
                        <span className={`celda-sub texto-${arribo.tono}`}>{arribo.texto}</span>
                      </td>
                      <td data-etiqueta="Estado"><EstadoBadge estado={e.estadoEnvio} /></td>
                      <td className="celda-accion">
                        <Link to={`/envios/${e.idEnvio}`} onClick={(ev) => ev.stopPropagation()} className="boton boton--fantasma">Ver detalle</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
