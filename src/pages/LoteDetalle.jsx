import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { lotesApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import InspeccionForm from '../components/InspeccionForm.jsx'
import Mapa from '../components/Mapa.jsx'
import { useCarga } from '../hooks.js'
import { formatoCoord } from '../geo.js'
import { ESTADOS_LOTE, LOTE_INSPECCIONABLE, RESULTADOS_INSPECCION, formatoFecha, formatoKg } from '../utils.js'

const num = (v, d = 2, unidad = '') => (v == null ? '—' : `${Number(v).toLocaleString('es-CO', { maximumFractionDigits: d })}${unidad}`)

function Inspecciones({ lote, esCafe, onEstado }) {
  const { tienePermiso } = useSesion()
  const lista = useCarga(() => lotesApi.inspecciones(lote.idLote), [lote.idLote])
  const [form, setForm] = useState(false)
  const [aviso, setAviso] = useState('')
  const puedeInspeccionar = tienePermiso('INSPECCION_REGISTRAR') && LOTE_INSPECCIONABLE.includes(lote.estadoLote)

  const alRegistrar = ({ inspeccion, estadoLote }) => {
    setForm(false)
    onEstado(estadoLote)
    lista.recargar()
    setAviso(`Inspección registrada: ${RESULTADOS_INSPECCION[inspeccion.resultado]?.etiqueta.toLowerCase()}. El lote quedó ${ESTADOS_LOTE[estadoLote]?.etiqueta.toLowerCase() ?? estadoLote}.`)
    setTimeout(() => setAviso(''), 5000)
  }

  return (
    <section className="tarjeta">
      <div className="tarjeta__cabecera">
        <div>
          <h2>Inspecciones de calidad</h2>
          <p className="texto-suave">Resultados de laboratorio y dictamen de cada inspección.</p>
        </div>
        {puedeInspeccionar && <button className="boton boton--primario" onClick={() => setForm(true)}>+ Registrar inspección</button>}
      </div>
      {aviso && <div className="aviso aviso--exito espacio-abajo" role="status"><Icono nombre="check" tam={16} /> {aviso}</div>}
      {lote.estadoLote === 'RECHAZADO' && (
        <div className="aviso aviso--alerta espacio-abajo"><Icono nombre="alerta" tam={16} /> Lote rechazado: no puede asignarse a una orden de exportación hasta que una nueva inspección lo apruebe.</div>
      )}
      {lista.cargando ? (
        <Cargando texto="Cargando inspecciones…" />
      ) : lista.error ? (
        <ErrorCaja error={lista.error} onReintentar={lista.recargar} />
      ) : lista.datos.length === 0 ? (
        <Vacio icono="check" titulo="Sin inspecciones" texto={puedeInspeccionar ? 'Registra la primera inspección del lote.' : 'El lote aún no ha sido inspeccionado.'} />
      ) : (
        <ul className="inspecciones">
          {lista.datos.map((i) => (
            <li key={i.idInspeccion} className={`inspeccion inspeccion--${RESULTADOS_INSPECCION[i.resultado]?.tono ?? 'neutro'}`}>
              <div className="inspeccion__cabecera">
                <div>
                  <EstadoBadge estado={i.resultado} catalogo={RESULTADOS_INSPECCION} />
                  <span className="texto-suave"> {formatoFecha(i.fechaInspeccion)}</span>
                </div>
                <span className="texto-suave mono">#{i.idInspeccion}</span>
              </div>
              <dl className="metricas">
                <div><dt>Humedad</dt><dd>{num(i.humedadPorcentaje, 1, ' %')}</dd></div>
                <div><dt>Defectos / 300 g</dt><dd>{num(i.defectosPor300g, 0)}</dd></div>
                {esCafe && <div><dt>Puntaje taza</dt><dd>{num(i.puntajeTaza)}</dd></div>}
                <div><dt>Ocratoxina A</dt><dd>{num(i.ocratoxinaPpb, 2, ' ppb')}</dd></div>
                <div><dt>Aflatoxinas</dt><dd>{num(i.aflatoxinasPpb, 2, ' ppb')}</dd></div>
              </dl>
              {i.observaciones && <p className="inspeccion__obs">{i.observaciones}</p>}
            </li>
          ))}
        </ul>
      )}
      {form && <InspeccionForm lote={lote} esCafe={esCafe} onCerrar={() => setForm(false)} onRegistrada={alRegistrar} />}
    </section>
  )
}

const PALETA = ['#c8893b', '#1f6feb', '#15803d', '#7c3aed', '#0e7490', '#c2410c']

/** SCRUM-19: cadena de origen del lote (productores, fincas, coordenadas y aportes). */
function Trazabilidad({ lote }) {
  const t = useCarga(() => lotesApi.trazabilidad(lote.idLote), [lote.idLote])
  const [sel, setSel] = useState(null)
  const enMapa = useMemo(
    () => (t.datos?.origen ?? []).map((o, i) => ({ id: i, nombre: `${o.nombreFinca} · ${num(o.porcentajeAporte)}%`, punto: [Number(o.latitud), Number(o.longitud)] })),
    [t.datos],
  )

  if (t.cargando) return <section className="tarjeta"><Cargando texto="Reconstruyendo la cadena de origen…" /></section>
  if (t.error) return <section className="tarjeta"><ErrorCaja error={t.error} onReintentar={t.recargar} /></section>
  const d = t.datos

  return (
    <section className="tarjeta">
      <div className="tarjeta__cabecera">
        <div>
          <h2>Trazabilidad de origen</h2>
          <p className="texto-suave">De qué fincas sale este lote y cuánto aporta cada una (EUDR).</p>
        </div>
        <span className={`badge badge--${d.completa ? 'exito' : 'alerta'}`}>{d.completa ? 'Trazabilidad completa' : 'Trazabilidad incompleta'}</span>
      </div>

      {d.origen.length === 0 ? (
        <Vacio icono="pin" titulo="Sin fincas de origen" texto="El lote todavía no tiene fincas asociadas." />
      ) : (
        <>
          <div className="aporte" aria-label="Aporte por finca">
            {d.origen.map((o, i) => (
              <span key={i} style={{ width: `${Number(o.porcentajeAporte)}%`, background: PALETA[i % PALETA.length] }} title={`${o.nombreFinca}: ${num(o.porcentajeAporte)}%`} />
            ))}
          </div>
          <p className="texto-suave aporte__resumen">
            Suma de aportes: <strong>{num(d.sumaPorcentaje)}%</strong> · {formatoKg(d.sumaKg)} de {formatoKg(d.pesoNetoKg)}
          </p>
          <div className="fincas">
            <Mapa fincas={enMapa} seleccionada={sel} onSeleccionar={setSel} alto={380} />
            <ul className="fincas__lista">
              {d.origen.map((o, i) => (
                <li key={i} className={`finca ${sel === i ? 'finca--sel' : ''}`} onClick={() => setSel(i)}>
                  <div className="finca__cabecera">
                    <strong><span className="punto-color" style={{ background: PALETA[i % PALETA.length] }} /> {o.nombreFinca}</strong>
                    <strong>{num(o.porcentajeAporte)}%</strong>
                  </div>
                  <p className="texto-suave finca__productor">{o.productor} · {o.municipio}, {o.departamento}</p>
                  <dl className="finca__datos">
                    <div><dt>Aporte</dt><dd>{formatoKg(o.kgAportados)}</dd></div>
                    <div><dt>Área</dt><dd>{num(o.areaHectareas)} ha</dd></div>
                    <div className="finca__dato--ancho"><dt>Coordenadas</dt><dd className="mono">{formatoCoord(o.latitud, o.longitud)}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}

export default function LoteDetalle() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { tienePermiso } = useSesion()
  const lote = useCarga(() => lotesApi.obtener(id), [id])
  const productos = useCarga(() => lotesApi.productos())
  const [estadoLocal, setEstadoLocal] = useState(null)
  const pestana = params.get('ver') ?? (tienePermiso('INSPECCION_REGISTRAR') ? 'calidad' : 'origen')

  if (lote.cargando) return <div className="pagina"><Cargando texto="Cargando lote…" /></div>
  if (lote.error) {
    return (
      <div className="pagina">
        <Link to="/lotes" className="volver"><Icono nombre="flecha" tam={16} /> Volver a lotes</Link>
        <ErrorCaja error={lote.error} onReintentar={[403, 404].includes(lote.error.estado) ? null : lote.recargar} />
      </div>
    )
  }

  const l = { ...lote.datos, estadoLote: estadoLocal ?? lote.datos.estadoLote }
  const p = (productos.datos ?? []).find((x) => x.idProducto === l.idProducto)
  const esCafe = p ? p.tipo === 'CAFE' : true

  return (
    <div className="pagina">
      <Link to="/lotes" className="volver"><Icono nombre="flecha" tam={16} /> Volver a lotes</Link>
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Lote de exportación</span>
          <h1 className="titulo-con-badge"><span className="mono">{l.codigoLote}</span> <EstadoBadge estado={l.estadoLote} catalogo={ESTADOS_LOTE} /></h1>
          <p className="texto-suave">{p ? `${p.nombreComercial}${p.variedad ? ` · ${p.variedad}` : ''} · HS ${p.codigoHs}` : '—'}</p>
        </div>
      </header>

      <div className="indicadores">
        <div className="indicador indicador--neutro"><span className="indicador__icono"><Icono nombre="contenedor" tam={20} /></span><div><span className="indicador__titulo">Peso neto</span><strong className="indicador__valor indicador__valor--md">{formatoKg(l.pesoNetoKg)}</strong></div></div>
        <div className="indicador indicador--neutro"><span className="indicador__icono"><Icono nombre="contenedor" tam={20} /></span><div><span className="indicador__titulo">Peso bruto</span><strong className="indicador__valor indicador__valor--md">{formatoKg(l.pesoBrutoKg)}</strong></div></div>
        <div className="indicador indicador--exito"><span className="indicador__icono"><Icono nombre="hoja" tam={20} /></span><div><span className="indicador__titulo">Cosecha</span><strong className="indicador__valor indicador__valor--md">{formatoFecha(l.fechaCosecha)}</strong></div></div>
        <div className="indicador indicador--primario"><span className="indicador__icono"><Icono nombre="calendario" tam={20} /></span><div><span className="indicador__titulo">Registro</span><strong className="indicador__valor indicador__valor--md">{formatoFecha(l.fechaRegistro)}</strong></div></div>
      </div>

      <div className="pestanas" role="tablist">
        <button role="tab" aria-selected={pestana === 'origen'} className={pestana === 'origen' ? 'activa' : ''} onClick={() => setParams({ ver: 'origen' })}>
          <Icono nombre="pin" tam={16} /> Trazabilidad
        </button>
        <button role="tab" aria-selected={pestana === 'calidad'} className={pestana === 'calidad' ? 'activa' : ''} onClick={() => setParams({ ver: 'calidad' })}>
          <Icono nombre="check" tam={16} /> Calidad
        </button>
      </div>

      {pestana === 'calidad' ? <Inspecciones lote={l} esCafe={esCafe} onEstado={setEstadoLocal} /> : <Trazabilidad lote={l} />}
    </div>
  )
}
