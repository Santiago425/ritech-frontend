import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { clientesApi, enviosApi, lotesApi, ordenesApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import AsignarLote from '../components/AsignarLote.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import Modal from '../components/Modal.jsx'
import OrdenForm from '../components/OrdenForm.jsx'
import ProgramarEnvio from '../components/ProgramarEnvio.jsx'
import { useCarga } from '../hooks.js'
import { ESTADOS_ENVIO, ESTADOS_ORDEN, INCOTERMS, PASOS_ORDEN, formatoDinero, formatoFecha, formatoKg } from '../utils.js'

export default function OrdenDetalle() {
  const { id } = useParams()
  const { datos, error, cargando, recargar } = useCarga(() => ordenesApi.detalle(id), [id])

  return (
    <div className="pagina">
      <Link to="/ordenes" className="volver"><Icono nombre="flecha" tam={16} /> Volver a órdenes</Link>
      {cargando ? (
        <Cargando texto="Consultando la orden…" />
      ) : error ? (
        <ErrorCaja error={error} onReintentar={error.estado === 404 || error.estado === 403 ? null : recargar} />
      ) : (
        <Detalle key={id} inicial={datos} />
      )}
    </div>
  )
}

function PasosOrden({ estado }) {
  if (estado === 'ANULADA') {
    return (
      <div className="aviso aviso--alerta" role="status">
        <Icono nombre="alerta" tam={16} /> Esta orden fue anulada. Sus lotes volvieron a quedar disponibles.
      </div>
    )
  }
  const actual = PASOS_ORDEN.indexOf(estado)
  return (
    <ol className="pasos pasos--4">
      {PASOS_ORDEN.map((paso, i) => {
        const hecho = i < actual || (i === actual && paso === 'ENTREGADA')
        const esActual = i === actual && !hecho
        return (
          <li key={paso} className={`paso ${hecho ? 'paso--hecho' : esActual ? 'paso--actual' : ''}`}>
            <span className="paso__punto">{hecho ? <Icono nombre="check" tam={14} /> : i + 1}</span>
            <span className="paso__texto">{ESTADOS_ORDEN[paso].etiqueta}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Detalle({ inicial }) {
  const { tienePermiso, puedeVerEnvios } = useSesion()
  const navigate = useNavigate()
  const { state } = useLocation()
  const puedeGestionar = tienePermiso('ORDENES_GESTIONAR')

  const [detalle, setDetalle] = useState(inicial)
  const [aviso, setAviso] = useState(state?.aviso ?? '')
  const [modal, setModal] = useState(null) // { tipo: 'asignar' | 'editarLote' | 'quitar' | 'estado' | 'editar' | 'envio', ... }

  const { orden, cliente, lotes: asignados = [] } = detalle
  const enBorrador = orden.estadoOrden === 'BORRADOR'
  const editable = puedeGestionar && enBorrador

  const lotes = useCarga(() => lotesApi.listar(), [asignados.length])
  const productos = useCarga(() => lotesApi.productos())
  const envios = useCarga(() => (puedeVerEnvios ? enviosApi.listar() : Promise.resolve([])), [orden.estadoOrden])
  const clientes = useCarga(() => (puedeGestionar && tienePermiso('CLIENTES_CONSULTAR') ? clientesApi.listar() : Promise.resolve([])))

  const lote = useMemo(() => {
    const m = new Map((lotes.datos ?? []).map((l) => [l.idLote, l]))
    return (id) => m.get(id)
  }, [lotes.datos])
  const producto = useMemo(() => {
    const m = new Map((productos.datos ?? []).map((p) => [p.idProducto, p]))
    return (id) => m.get(id)
  }, [productos.datos])

  const disponibles = (lotes.datos ?? []).filter((l) => l.estadoLote === 'APROBADO')
  const envio = (envios.datos ?? []).find((e) => e.idOrden === orden.idOrden)
  const totalKg = asignados.reduce((s, a) => s + Number(a.kgAsignados), 0)
  const valorCalculado = asignados.reduce((s, a) => s + Number(a.kgAsignados) * Number(a.precioUnitario), 0)
  const valorTotal = Number(orden.valorTotal ?? 0) > 0 ? orden.valorTotal : valorCalculado

  const avisar = (t) => {
    setAviso(t)
    setTimeout(() => setAviso(''), 5000)
  }

  const alCambiarDetalle = (nuevo, texto) => {
    setDetalle(nuevo)
    setModal(null)
    avisar(texto)
  }

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Orden de exportación</span>
          <h1 className="titulo-con-badge">
            <span className="mono">{orden.numeroOrden}</span> <EstadoBadge estado={orden.estadoOrden} catalogo={ESTADOS_ORDEN} />
          </h1>
          <p className="texto-suave">{cliente?.razonSocial ?? `Cliente #${orden.idCliente}`} · {formatoFecha(orden.fechaOrden)}</p>
        </div>
        {puedeGestionar && (
          <div className="acciones">
            {enBorrador && (
              <>
                <button className="boton boton--secundario" onClick={() => setModal({ tipo: 'editar' })} disabled={!clientes.datos}>Editar</button>
                <button className="boton boton--fantasma texto-alerta" onClick={() => setModal({ tipo: 'estado', estado: 'ANULADA' })}>Anular</button>
                <button className="boton boton--primario" onClick={() => setModal({ tipo: 'estado', estado: 'CONFIRMADA' })} disabled={asignados.length === 0} title={asignados.length === 0 ? 'Asigna al menos un lote' : undefined}>
                  <Icono nombre="check" tam={16} /> Confirmar orden
                </button>
              </>
            )}
            {orden.estadoOrden === 'CONFIRMADA' && (
              <>
                <button className="boton boton--fantasma texto-alerta" onClick={() => setModal({ tipo: 'estado', estado: 'ANULADA' })}>Anular</button>
                {!envio && <button className="boton boton--secundario" onClick={() => setModal({ tipo: 'estado', estado: 'BORRADOR' })}>Volver a borrador</button>}
                {!envio && !envios.cargando && (
                  <button className="boton boton--primario" onClick={() => setModal({ tipo: 'envio' })}>
                    <Icono nombre="barco" tam={16} /> Programar envío
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </header>

      {aviso && <div className="aviso aviso--exito" role="status"><Icono nombre="check" tam={16} /> {aviso}</div>}

      <section className="tarjeta">
        <PasosOrden estado={orden.estadoOrden} />
        {enBorrador && puedeGestionar && (
          <p className="texto-suave nota-pie">
            {asignados.length === 0
              ? 'Siguiente paso: asigna uno o más lotes aprobados y luego confirma la orden.'
              : 'Cuando los lotes y precios estén listos, confirma la orden para poder programar el envío.'}
          </p>
        )}
        {orden.estadoOrden === 'CONFIRMADA' && !envio && !envios.cargando && (
          <p className="texto-suave nota-pie">Siguiente paso: programa el envío con el transportista.</p>
        )}
      </section>

      <div className="rejilla-orden">
        <section className="tarjeta">
          <div className="tarjeta__cabecera">
            <div>
              <h2>Lotes de la orden</h2>
              <p className="texto-suave">{asignados.length} {asignados.length === 1 ? 'lote' : 'lotes'} · {formatoKg(totalKg)}</p>
            </div>
            {editable && (
              <button className="boton boton--secundario" onClick={() => setModal({ tipo: 'asignar' })} disabled={lotes.cargando}>
                + Asignar lote
              </button>
            )}
          </div>

          {asignados.length === 0 ? (
            <Vacio icono="contenedor" titulo="Sin lotes asignados" texto={editable ? `Hay ${disponibles.length} ${disponibles.length === 1 ? 'lote aprobado disponible' : 'lotes aprobados disponibles'}.` : null} />
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla tabla--compacta">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th className="derecha">Kg</th>
                    <th className="derecha">Precio / kg</th>
                    <th className="derecha">Subtotal</th>
                    {editable && <th aria-label="Acciones" />}
                  </tr>
                </thead>
                <tbody>
                  {asignados.map((a) => {
                    const l = lote(a.idLote)
                    const p = l ? producto(l.idProducto) : null
                    return (
                      <tr key={a.idLote} onClick={() => navigate(`/lotes/${a.idLote}`)}>
                        <td data-etiqueta="Lote">
                          <strong className="mono">{l?.codigoLote ?? `Lote #${a.idLote}`}</strong>
                          {p && <span className="celda-sub">{p.nombreComercial} · HS {p.codigoHs}</span>}
                        </td>
                        <td data-etiqueta="Kg" className="derecha nowrap">{formatoKg(a.kgAsignados)}</td>
                        <td data-etiqueta="Precio / kg" className="derecha nowrap">{formatoDinero(a.precioUnitario, orden.moneda)}</td>
                        <td data-etiqueta="Subtotal" className="derecha nowrap"><strong>{formatoDinero(Number(a.kgAsignados) * Number(a.precioUnitario), orden.moneda)}</strong></td>
                        {editable && (
                          <td className="celda-accion">
                            <button className="boton boton--fantasma" onClick={(e) => { e.stopPropagation(); setModal({ tipo: 'editarLote', asignacion: a }) }}>Editar</button>
                            <button className="boton boton--fantasma texto-alerta" onClick={(e) => { e.stopPropagation(); setModal({ tipo: 'quitar', asignacion: a }) }}>Quitar</button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="derecha nowrap">{formatoKg(totalKg)}</td>
                    <td />
                    <td className="derecha nowrap">{formatoDinero(valorTotal, orden.moneda)}</td>
                    {editable && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        <div className="columna">
          <section className="tarjeta">
            <h2>Resumen</h2>
            <div className="total-orden">
              <span>Valor total</span>
              <strong>{formatoDinero(valorTotal, orden.moneda)}</strong>
            </div>
            <dl className="lista-datos">
              <div><dt>Incoterm</dt><dd><span className="mono">{orden.incoterm}</span> · {INCOTERMS[orden.incoterm] ?? ''}</dd></div>
              <div><dt>Moneda</dt><dd>{orden.moneda}</dd></div>
              <div><dt>Fecha</dt><dd>{formatoFecha(orden.fechaOrden)}</dd></div>
              <div><dt>Peso total</dt><dd>{formatoKg(totalKg)}</dd></div>
            </dl>
          </section>

          {cliente && (
            <section className="tarjeta">
              <h2>Importador</h2>
              <dl className="lista-datos">
                <div><dt>Razón social</dt><dd>{cliente.razonSocial}</dd></div>
                <div><dt>EORI</dt><dd className="mono">{cliente.numeroEori}</dd></div>
                {cliente.nitVat && <div><dt>VAT</dt><dd className="mono">{cliente.nitVat}</dd></div>}
                <div><dt>Ciudad</dt><dd>{cliente.ciudad}</dd></div>
                <div><dt>Contacto</dt><dd><a className="enlace" href={`mailto:${cliente.emailContacto}`}>{cliente.emailContacto}</a></dd></div>
              </dl>
            </section>
          )}

          {envio && (
            <section className="tarjeta">
              <h2>Envío</h2>
              <Link to={`/envios/${envio.idEnvio}`} className="tarjeta-envio">
                <div>
                  <strong>{envio.puertoOrigen} → {envio.puertoDestino}</strong>
                  <span className="celda-sub">Arribo estimado {formatoFecha(envio.fechaEstimadaArribo)}</span>
                </div>
                <EstadoBadge estado={envio.estadoEnvio} catalogo={ESTADOS_ENVIO} />
              </Link>
            </section>
          )}
        </div>
      </div>

      {(modal?.tipo === 'asignar' || modal?.tipo === 'editarLote') && (
        <AsignarLote
          orden={orden}
          disponibles={disponibles}
          producto={producto}
          asignacion={modal.asignacion}
          lote={modal.asignacion ? lote(modal.asignacion.idLote) ?? { idLote: modal.asignacion.idLote, codigoLote: `Lote #${modal.asignacion.idLote}`, pesoNetoKg: modal.asignacion.kgAsignados } : null}
          onCerrar={() => setModal(null)}
          onHecho={alCambiarDetalle}
        />
      )}

      {modal?.tipo === 'quitar' && (
        <Confirmar
          titulo="Quitar lote de la orden"
          texto={`El lote ${lote(modal.asignacion.idLote)?.codigoLote ?? ''} vuelve a quedar aprobado y disponible para otra orden.`}
          boton="Quitar lote"
          peligro
          accion={() => ordenesApi.quitarLote(orden.idOrden, modal.asignacion.idLote)}
          onCerrar={() => setModal(null)}
          onHecho={(d) => alCambiarDetalle(d, 'Lote retirado de la orden.')}
        />
      )}

      {modal?.tipo === 'estado' && (
        <Confirmar
          {...TEXTOS_ESTADO[modal.estado](orden, asignados.length, formatoDinero(valorTotal, orden.moneda))}
          accion={() => ordenesApi.cambiarEstado(orden.idOrden, modal.estado)}
          onCerrar={() => setModal(null)}
          onHecho={(o) => {
            alCambiarDetalle({ ...detalle, orden: o, lotes: modal.estado === 'ANULADA' ? [] : asignados }, TEXTOS_ESTADO[modal.estado](orden).exito)
          }}
        />
      )}

      {modal?.tipo === 'editar' && (
        <OrdenForm
          orden={orden}
          clientes={clientes.datos ?? []}
          tieneLotes={asignados.length > 0}
          onCerrar={() => setModal(null)}
          onGuardada={(o) => {
            const nuevoCliente = (clientes.datos ?? []).find((c) => c.idCliente === o.idCliente) ?? cliente
            alCambiarDetalle({ ...detalle, orden: o, cliente: nuevoCliente }, 'Orden actualizada.')
          }}
        />
      )}

      {modal?.tipo === 'envio' && (
        <ProgramarEnvio
          orden={orden}
          destinoSugerido={cliente?.ciudad}
          onCerrar={() => setModal(null)}
          onProgramado={(d) => navigate(`/envios/${d.envio.idEnvio}`)}
        />
      )}
    </>
  )
}

const TEXTOS_ESTADO = {
  CONFIRMADA: (o, n, valor) => ({
    titulo: 'Confirmar orden',
    texto: `La orden ${o.numeroOrden} queda confirmada con ${n} ${n === 1 ? 'lote' : 'lotes'} por ${valor}. Después ya no se pueden cambiar lotes ni precios, salvo que la devuelvas a borrador.`,
    boton: 'Confirmar orden',
    exito: 'Orden confirmada. Ya puedes programar el envío.',
  }),
  BORRADOR: (o) => ({
    titulo: 'Volver a borrador',
    texto: `La orden ${o.numeroOrden} vuelve a borrador para corregir lotes o precios.`,
    boton: 'Volver a borrador',
    exito: 'La orden volvió a borrador.',
  }),
  ANULADA: (o) => ({
    titulo: 'Anular orden',
    texto: `La orden ${o.numeroOrden} se anula y no se puede reactivar. Sus lotes vuelven a quedar aprobados y disponibles.`,
    boton: 'Anular orden',
    peligro: true,
    exito: 'Orden anulada. Sus lotes quedaron disponibles.',
  }),
}

function Confirmar({ titulo, texto, boton, peligro = false, accion, onCerrar, onHecho }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      onHecho(await accion())
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <Modal
      titulo={titulo}
      onCerrar={onCerrar}
      bloqueado={enviando}
      onSubmit={confirmar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button className={`boton ${peligro ? 'boton--peligro' : 'boton--primario'}`} disabled={enviando}>
            {enviando ? <span className="spinner spinner--claro" /> : boton}
          </button>
        </>
      }
    >
      <p>{texto}</p>
      {error && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {error}</div>}
    </Modal>
  )
}
