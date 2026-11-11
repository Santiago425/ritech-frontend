import { useMemo, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { lotesApi, productoresApi } from '../api/cliente.js'
import AporteForm from '../components/AporteForm.jsx'
import LoteForm from '../components/LoteForm.jsx'
import Modal from '../components/Modal.jsx'
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
const ORIGEN_EDITABLE = ['REGISTRADO', 'EN_INSPECCION', 'RECHAZADO']

async function cargarCatalogoFincas() {
  const productores = await productoresApi.listar()
  const fincas = (await Promise.all(productores.map((p) => productoresApi.fincas(p.idProductor)))).flat()
  return { productores, fincas }
}

/** SCRUM-16: gestión de las fincas de origen del lote y cierre de la trazabilidad. */
function GestionOrigen({ lote, onCambio }) {
  const aportes = useCarga(() => lotesApi.aportes(lote.idLote), [lote.idLote])
  const catalogo = useCarga(cargarCatalogoFincas)
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null) // { tono, texto }
  const [cerrando, setCerrando] = useState(false)

  const lista = aportes.datos ?? []
  const finca = (id) => catalogo.datos?.fincas.find((f) => f.idFinca === id)
  const productor = (id) => catalogo.datos?.productores.find((p) => p.idProductor === id)
  const suma = lista.reduce((s, a) => s + Number(a.porcentajeAporte), 0)

  const avisar = (tono, texto) => {
    setAviso({ tono, texto })
    setTimeout(() => setAviso(null), 6000)
  }
  const refrescar = (texto) => {
    setModal(null)
    aportes.recargar()
    onCambio()
    if (texto) avisar('exito', texto)
  }

  const cerrar = async () => {
    setCerrando(true)
    try {
      const r = await lotesApi.cerrarTrazabilidad(lote.idLote)
      avisar('exito', `${r?.mensaje ?? 'Trazabilidad completa'}: ${r?.fincas_origen ?? lista.length} ${Number(r?.fincas_origen ?? lista.length) === 1 ? 'finca' : 'fincas'} suman el 100% del peso neto.`)
    } catch (err) {
      avisar('error', err.message)
    } finally {
      setCerrando(false)
    }
  }

  return (
    <section className="tarjeta gestion-origen">
      <div className="tarjeta__cabecera">
        <div>
          <h2>Fincas asociadas</h2>
          <p className="texto-suave">Asigna qué porcentaje del lote sale de cada finca. Debe sumar 100%.</p>
        </div>
        <div className="acciones">
          <button className="boton boton--secundario" onClick={cerrar} disabled={cerrando || lista.length === 0}>
            {cerrando ? <span className="spinner" /> : <><Icono nombre="check" tam={16} /> Verificar trazabilidad</>}
          </button>
          <button className="boton boton--primario" onClick={() => setModal({ tipo: 'nuevo' })} disabled={!catalogo.datos || suma >= 99.999}>
            + Asociar finca
          </button>
        </div>
      </div>

      {aviso && (
        <div className={`aviso aviso--${aviso.tono} espacio-abajo`} role={aviso.tono === 'error' ? 'alert' : 'status'}>
          <Icono nombre={aviso.tono === 'error' ? 'alerta' : 'check'} tam={16} /> {aviso.texto}
        </div>
      )}

      <div className="barra-suma" aria-label={`Asignado ${num(suma)}%`}>
        <span style={{ width: `${Math.min(suma, 100)}%` }} className={Math.abs(suma - 100) < 0.01 ? 'barra-suma--completa' : ''} />
      </div>
      <p className="texto-suave aporte__resumen">Asignado <strong>{num(suma)}%</strong> · faltan {num(Math.max(0, 100 - suma))}%</p>

      {aportes.cargando || catalogo.cargando ? (
        <Cargando texto="Cargando fincas…" />
      ) : aportes.error || catalogo.error ? (
        <ErrorCaja error={aportes.error ?? catalogo.error} onReintentar={() => { aportes.recargar(); catalogo.recargar() }} />
      ) : lista.length === 0 ? (
        <Vacio icono="pin" titulo="Sin fincas asociadas" texto='Usa "Asociar finca" para registrar el origen del lote.' />
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla tabla--compacta">
            <thead>
              <tr><th>Finca</th><th className="derecha">Aporte</th><th className="derecha">Kg</th><th aria-label="Acciones" /></tr>
            </thead>
            <tbody>
              {lista.map((a) => {
                const f = finca(a.idFinca)
                return (
                  <tr key={a.idFinca} className="tabla__fila--fija">
                    <td data-etiqueta="Finca">
                      <strong>{f?.nombreFinca ?? `Finca #${a.idFinca}`}</strong>
                      {f && <span className="celda-sub">{productor(f.idProductor)?.nombre} · {f.areaHectareas} ha</span>}
                    </td>
                    <td data-etiqueta="Aporte" className="derecha">{num(a.porcentajeAporte)}%</td>
                    <td data-etiqueta="Kg" className="derecha nowrap">{formatoKg(a.kgAportados)}</td>
                    <td className="celda-accion">
                      <button className="boton boton--fantasma" onClick={() => setModal({ tipo: 'editar', aporte: a })}>Editar</button>
                      <button className="boton boton--fantasma texto-alerta" onClick={() => setModal({ tipo: 'quitar', aporte: a })}>Quitar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {(modal?.tipo === 'nuevo' || modal?.tipo === 'editar') && catalogo.datos && (
        <AporteForm lote={lote} catalogo={catalogo.datos} aportes={lista} aporte={modal.aporte} onCerrar={() => setModal(null)} onGuardado={(_, texto) => refrescar(texto)} />
      )}
      {modal?.tipo === 'quitar' && (
        <QuitarAporte lote={lote} aporte={modal.aporte} nombre={finca(modal.aporte.idFinca)?.nombreFinca} onCerrar={() => setModal(null)} onHecho={refrescar} />
      )}
    </section>
  )
}

function QuitarAporte({ lote, aporte, nombre, onCerrar, onHecho }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const confirmar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await lotesApi.quitarAporte(lote.idLote, aporte.idFinca)
      onHecho(`${nombre ?? 'La finca'} ya no está asociada al lote.`)
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }
  return (
    <Modal
      titulo="Quitar finca del lote"
      onCerrar={onCerrar}
      bloqueado={enviando}
      onSubmit={confirmar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button className="boton boton--peligro" disabled={enviando}>{enviando ? <span className="spinner spinner--claro" /> : 'Quitar finca'}</button>
        </>
      }
    >
      <p>{nombre ?? 'La finca'} deja de ser origen del lote {lote.codigoLote} ({num(aporte.porcentajeAporte)}%, {formatoKg(aporte.kgAportados)}).</p>
      {error && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {error}</div>}
    </Modal>
  )
}

function Trazabilidad({ lote }) {
  const { tienePermiso } = useSesion()
  const puedeEditar = tienePermiso('LOTES_TRAZABILIDAD') && ORIGEN_EDITABLE.includes(lote.estadoLote)
  const t = useCarga(() => lotesApi.trazabilidad(lote.idLote), [lote.idLote])
  const [sel, setSel] = useState(null)
  const enMapa = useMemo(
    () => (t.datos?.origen ?? []).map((o, i) => ({ id: i, nombre: `${o.nombreFinca} · ${num(o.porcentajeAporte)}%`, punto: [Number(o.latitud), Number(o.longitud)] })),
    [t.datos],
  )

  const gestion = puedeEditar ? <GestionOrigen lote={lote} onCambio={t.recargar} /> : null
  if (t.cargando && !t.datos) return <>{gestion}<section className="tarjeta"><Cargando texto="Reconstruyendo la cadena de origen…" /></section></>
  if (t.error) return <>{gestion}<section className="tarjeta"><ErrorCaja error={t.error} onReintentar={t.recargar} /></section></>
  const d = t.datos

  return (
    <>
    {gestion}
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
    </>
  )
}

export default function LoteDetalle() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { tienePermiso } = useSesion()
  const { state } = useLocation()
  const lote = useCarga(() => lotesApi.obtener(id), [id])
  const productos = useCarga(() => lotesApi.productos())
  const [estadoLocal, setEstadoLocal] = useState(null)
  const [editando, setEditando] = useState(false)
  const [aviso, setAviso] = useState('')
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
        {tienePermiso('LOTES_CREAR') && l.estadoLote === 'REGISTRADO' && (
          <button className="boton boton--secundario" onClick={() => setEditando(true)} disabled={!productos.datos}>Editar lote</button>
        )}
      </header>

      {(aviso || state?.aviso) && <div className="aviso aviso--exito" role="status"><Icono nombre="check" tam={16} /> {aviso || state.aviso}</div>}
      {editando && (
        <LoteForm
          lote={l}
          productos={productos.datos ?? []}
          onCerrar={() => setEditando(false)}
          onGuardado={() => {
            setEditando(false)
            setAviso('Lote actualizado.')
            setTimeout(() => setAviso(''), 4000)
            lote.recargar()
          }}
        />
      )}

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
