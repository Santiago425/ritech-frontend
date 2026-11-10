import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { lotesApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import { useCarga } from '../hooks.js'
import { ESTADOS_LOTE, LOTE_INSPECCIONABLE, formatoFecha, formatoKg } from '../utils.js'

export default function Lotes() {
  const { esCliente, tienePermiso } = useSesion()
  const esInspector = tienePermiso('INSPECCION_REGISTRAR')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const estado = params.get('estado') ?? ''
  const idProducto = params.get('producto') ?? ''
  const productos = useCarga(() => lotesApi.productos())
  const lotes = useCarga(() => lotesApi.listar({ estado, idProducto }), [estado, idProducto])

  const producto = useMemo(() => {
    const mapa = new Map((productos.datos ?? []).map((p) => [p.idProducto, p]))
    return (id) => mapa.get(id)
  }, [productos.datos])

  const filtrar = (clave, valor) => {
    const p = new URLSearchParams(params)
    if (valor) p.set(clave, valor)
    else p.delete(clave)
    setParams(p)
  }

  const pendientes = (lotes.datos ?? []).filter((l) => ['REGISTRADO', 'EN_INSPECCION'].includes(l.estadoLote)).length

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">{esInspector ? 'Calidad' : 'Origen'}</span>
          <h1>{esCliente ? 'Mis lotes' : 'Lotes de exportación'}</h1>
          <p className="texto-suave">
            {esCliente ? 'Consulta el origen y la calidad de los lotes que compraste.' : esInspector ? 'Inspecciona los lotes y emite el dictamen de calidad.' : 'Lotes de café y cacao con su calidad y trazabilidad.'}
          </p>
        </div>
      </header>

      {esInspector && pendientes > 0 && !estado && (
        <div className="aviso aviso--info"><span>Hay <strong>{pendientes}</strong> {pendientes === 1 ? 'lote pendiente' : 'lotes pendientes'} de inspección.</span></div>
      )}

      <section className="tarjeta">
        <div className="filtros">
          <div className="filtros__chips">
            <button className={`chip ${!estado ? 'chip--activo' : ''}`} onClick={() => filtrar('estado', '')}>Todos</button>
            {Object.entries(ESTADOS_LOTE).map(([clave, info]) => (
              <button key={clave} className={`chip ${estado === clave ? 'chip--activo' : ''}`} onClick={() => filtrar('estado', clave)}>{info.etiqueta}</button>
            ))}
          </div>
          <select className="selector" value={idProducto} onChange={(e) => filtrar('producto', e.target.value)} aria-label="Filtrar por producto">
            <option value="">Todos los productos</option>
            {(productos.datos ?? []).map((p) => <option key={p.idProducto} value={p.idProducto}>{p.nombreComercial}</option>)}
          </select>
        </div>

        {lotes.cargando ? (
          <Cargando texto="Cargando lotes…" />
        ) : lotes.error ? (
          <ErrorCaja error={lotes.error} onReintentar={lotes.recargar} />
        ) : lotes.datos.length === 0 ? (
          <Vacio icono="contenedor" titulo="No hay lotes" texto={estado || idProducto ? 'Prueba con otro filtro.' : null} />
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla tabla--compacta">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Producto</th>
                  <th>Peso neto</th>
                  <th>Cosecha</th>
                  <th>Estado</th>
                  <th aria-label="Abrir" />
                </tr>
              </thead>
              <tbody>
                {lotes.datos.map((l) => {
                  const p = producto(l.idProducto)
                  return (
                    <tr key={l.idLote} onClick={() => navigate(`/lotes/${l.idLote}`)}>
                      <td data-etiqueta="Lote"><strong className="mono">{l.codigoLote}</strong><span className="celda-sub">Registrado {formatoFecha(l.fechaRegistro)}</span></td>
                      <td data-etiqueta="Producto">
                        {p ? <><span className={`tipo tipo--${p.tipo.toLowerCase()}`}>{p.tipo === 'CAFE' ? 'Café' : 'Cacao'}</span> {p.nombreComercial}</> : '—'}
                      </td>
                      <td data-etiqueta="Peso neto" className="nowrap">{formatoKg(l.pesoNetoKg)}</td>
                      <td data-etiqueta="Cosecha" className="nowrap">{formatoFecha(l.fechaCosecha)}</td>
                      <td data-etiqueta="Estado"><EstadoBadge estado={l.estadoLote} catalogo={ESTADOS_LOTE} /></td>
                      <td className="celda-accion">
                        <span className="boton boton--fantasma">{esInspector && LOTE_INSPECCIONABLE.includes(l.estadoLote) ? 'Inspeccionar' : 'Ver lote'}</span>
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
