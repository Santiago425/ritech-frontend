import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { reportesApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import { useCarga } from '../hooks.js'
import { ESTADOS_ENVIO, ESTADOS_LOTE, ESTADOS_ORDEN, formatoDinero, formatoFecha, formatoFechaHora, formatoKg, resumenArribo } from '../utils.js'
import EstadoBadge from './EstadoBadge.jsx'
import { Cargando, ErrorCaja } from './Estados.jsx'
import Icono from './Icono.jsx'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const compacto = (v, moneda) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: moneda, notation: 'compact', maximumFractionDigits: 1 })

function Indicador({ titulo, valor, detalle, icono, tono, a }) {
  const cuerpo = (
    <>
      <span className="indicador__icono"><Icono nombre={icono} tam={20} /></span>
      <div>
        <span className="indicador__titulo">{titulo}</span>
        <strong className="indicador__valor">{valor}</strong>
        {detalle && <span className="indicador__detalle">{detalle}</span>}
      </div>
    </>
  )
  return a ? <Link to={a} className={`indicador indicador--${tono} indicador--enlace`}>{cuerpo}</Link> : <div className={`indicador indicador--${tono}`}>{cuerpo}</div>
}

/** Barras verticales de una sola serie: valor vendido por mes (últimos 12 meses). */
function GraficaMeses({ datos, moneda }) {
  const [activo, setActivo] = useState(null)
  const meses = useMemo(() => {
    const hoy = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - 11 + i, 1)
      const fila = datos.find((v) => v.anio === d.getFullYear() && v.mes === d.getMonth() + 1 && v.moneda === moneda)
      return { clave: `${d.getFullYear()}-${d.getMonth()}`, etiqueta: MESES[d.getMonth()], anio: d.getFullYear(), valor: Number(fila?.valor ?? 0), ordenes: fila?.ordenes ?? 0 }
    })
  }, [datos, moneda])

  const max = Math.max(...meses.map((m) => m.valor), 1)
  // Escala "redonda" para las líneas guía.
  const paso = 10 ** Math.floor(Math.log10(max))
  const tope = Math.ceil(max / paso) * paso
  const guias = [0, 0.5, 1].map((f) => f * tope)
  const total = meses.reduce((s, m) => s + m.valor, 0)
  const m = activo !== null ? meses[activo] : null

  return (
    <div className="grafica">
      <div className="grafica__cabecera">
        <div>
          <span className="texto-suave">Total 12 meses</span>
          <strong>{formatoDinero(total, moneda)}</strong>
        </div>
        <div className="grafica__lectura" aria-live="polite">
          {m ? <><strong>{m.etiqueta} {m.anio}</strong> · {formatoDinero(m.valor, moneda)} · {m.ordenes} {m.ordenes === 1 ? 'orden' : 'órdenes'}</> : <span className="texto-suave">Pasa el cursor por una barra</span>}
        </div>
      </div>
      <div className="grafica__area" role="img" aria-label={`Valor vendido por mes en ${moneda}`} onMouseLeave={() => setActivo(null)}>
        <div className="grafica__guias">
          {guias.slice().reverse().map((g) => (
            <div key={g} className="grafica__guia"><span>{g === 0 ? '0' : compacto(g, moneda)}</span></div>
          ))}
        </div>
        <div className="grafica__barras">
          {meses.map((mes, i) => (
            <button
              key={mes.clave}
              type="button"
              className={`grafica__columna ${activo === i ? 'grafica__columna--activa' : ''}`}
              onMouseEnter={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              onBlur={() => setActivo(null)}
              aria-label={`${mes.etiqueta} ${mes.anio}: ${formatoDinero(mes.valor, moneda)}`}
            >
              <span className="grafica__barra" style={{ height: `${(mes.valor / tope) * 100}%` }} />
              <span className="grafica__mes">{mes.etiqueta}</span>
            </button>
          ))}
        </div>
      </div>
      <table className="solo-lectores">
        <caption>Valor vendido por mes ({moneda})</caption>
        <tbody>{meses.map((mes) => <tr key={mes.clave}><th>{mes.etiqueta} {mes.anio}</th><td>{formatoDinero(mes.valor, moneda)}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

/** Distribución por estado como barras horizontales de un solo tono, con el conteo al lado. */
function Distribucion({ conteos, catalogo, enlace }) {
  const filas = Object.entries(conteos ?? {})
  const max = Math.max(...filas.map(([, n]) => n), 1)
  return (
    <ul className="distribucion">
      {filas.map(([estado, n]) => (
        <li key={estado}>
          <Link to={enlace(estado)}>
            <span className="distribucion__nombre">{catalogo[estado]?.etiqueta ?? estado}</span>
            <span className="distribucion__pista"><span style={{ width: `${(n / max) * 100}%` }} /></span>
            <strong>{n}</strong>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** SCRUM-31: tablero de indicadores para el personal interno. */
export default function Tablero() {
  const { tienePermiso } = useSesion()
  const t = useCarga(() => reportesApi.tablero())
  const monedas = useMemo(() => [...new Set((t.datos?.valorPorMes ?? []).map((v) => v.moneda))].sort(), [t.datos])
  const [moneda, setMoneda] = useState(null)

  if (t.cargando && !t.datos) return <Cargando texto="Calculando indicadores…" />
  if (t.error) return <ErrorCaja error={t.error} onReintentar={t.recargar} />
  const d = t.datos
  const monedaVista = moneda ?? (monedas.includes('EUR') ? 'EUR' : monedas[0] ?? 'EUR')
  const verOrdenes = tienePermiso('ORDENES_GESTIONAR')

  return (
    <>
      <div className="indicadores">
        <Indicador titulo="Órdenes" valor={d.ordenesTotal} detalle={`${d.ordenesPorEstado?.BORRADOR ?? 0} en borrador`} icono="documento" tono="neutro" a={verOrdenes ? '/ordenes' : null} />
        <Indicador titulo="Kg exportados" valor={formatoKg(d.kgExportados)} detalle="Órdenes en tránsito o entregadas" icono="contenedor" tono="primario" />
        <Indicador titulo="Lotes aprobados" valor={d.lotesAprobados} detalle={`${d.lotesRechazados} ${d.lotesRechazados === 1 ? 'rechazado' : 'rechazados'}`} icono="check" tono="exito" a="/lotes" />
        <Indicador titulo="Envíos en tránsito" valor={d.enviosEnTransito} detalle={d.enviosConIncidencia ? `${d.enviosConIncidencia} con incidencia` : 'Sin incidencias'} icono={d.enviosConIncidencia ? 'alerta' : 'barco'} tono={d.enviosConIncidencia ? 'alerta' : 'primario'} a={verOrdenes ? '/envios' : null} />
      </div>

      <div className="rejilla-tablero">
        <section className="tarjeta">
          <div className="tarjeta__cabecera">
            <div>
              <h2>Valor vendido por mes</h2>
              <p className="texto-suave">Órdenes confirmadas, en tránsito o entregadas de los últimos 12 meses.</p>
            </div>
            {monedas.length > 1 && (
              <div className="filtros__chips" role="group" aria-label="Moneda">
                {monedas.map((m) => <button key={m} className={`chip ${monedaVista === m ? 'chip--activo' : ''}`} onClick={() => setMoneda(m)}>{m}</button>)}
              </div>
            )}
          </div>
          <GraficaMeses datos={d.valorPorMes ?? []} moneda={monedaVista} />
        </section>

        <section className="tarjeta">
          <h2>Órdenes por estado</h2>
          <Distribucion conteos={d.ordenesPorEstado} catalogo={ESTADOS_ORDEN} enlace={() => '/ordenes'} />
          <h2 className="espacio-arriba">Lotes por estado</h2>
          <Distribucion conteos={d.lotesPorEstado} catalogo={ESTADOS_LOTE} enlace={(e) => `/lotes?estado=${e}`} />
        </section>
      </div>

      <section className="tarjeta">
        <div className="tarjeta__cabecera">
          <div>
            <h2>Envíos activos</h2>
            <p className="texto-suave">En tránsito o con incidencia. Actualizado {formatoFechaHora(d.generado)}.</p>
          </div>
          {verOrdenes && <Link to="/envios" className="boton boton--secundario">Ver todos</Link>}
        </div>
        {d.enviosActivos.length === 0 ? (
          <p className="texto-suave">No hay envíos en tránsito en este momento.</p>
        ) : (
          <ul className="lista-arribos">
            {d.enviosActivos.map((e) => {
              const arribo = resumenArribo(e)
              const contenido = (
                <>
                  <div className="lista-arribos__ruta">
                    <strong>{e.puertoOrigen} → {e.puertoDestino}</strong>
                    <span>{e.numeroOrden} · {e.cliente} · {e.transportista} · Arribo est. {formatoFecha(e.fechaEstimadaArribo)}</span>
                  </div>
                  <span className={`texto-${arribo.tono}`}>{arribo.texto}</span>
                  <EstadoBadge estado={e.estadoEnvio} catalogo={ESTADOS_ENVIO} />
                </>
              )
              return <li key={e.idEnvio}>{verOrdenes ? <Link to={`/envios/${e.idEnvio}`}>{contenido}</Link> : <div className="lista-arribos__fila">{contenido}</div>}</li>
            })}
          </ul>
        )}
      </section>
    </>
  )
}
