import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSesion } from '../auth/SesionContext.jsx'
import { enviosApi } from '../api/cliente.js'
import Bitacora from '../components/Bitacora.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import PasosEnvio from '../components/PasosEnvio.jsx'
import RegistrarEvento from '../components/RegistrarEvento.jsx'
import RutaEnvio from '../components/RutaEnvio.jsx'
import { useCarga } from '../hooks.js'
import { formatoFecha, formatoFechaHora, resumenArribo } from '../utils.js'

function Dato({ icono, etiqueta, valor, mono }) {
  return (
    <div className="dato">
      <Icono nombre={icono} tam={16} />
      <div>
        <span>{etiqueta}</span>
        <strong className={mono ? 'mono' : ''}>{valor || '—'}</strong>
      </div>
    </div>
  )
}

export default function EnvioDetalle() {
  const { id } = useParams()
  const { datos, error, cargando, recargar } = useCarga(() => enviosApi.detalle(id), [id])

  return (
    <div className="pagina">
      <Link to="/envios" className="volver"><Icono nombre="flecha" tam={16} /> Volver a envíos</Link>
      {cargando ? (
        <Cargando texto="Consultando el envío…" />
      ) : error ? (
        <ErrorCaja error={error} onReintentar={error.estado === 404 || error.estado === 403 ? null : recargar} />
      ) : (
        <Detalle key={id} inicial={datos} onRecargar={recargar} />
      )}
    </div>
  )
}

function Detalle({ inicial, onRecargar }) {
  const { tienePermiso } = useSesion()
  const [detalle, setDetalle] = useState(inicial)
  const [formAbierto, setFormAbierto] = useState(false)
  const [aviso, setAviso] = useState('')
  const { envio, transportista, numeroOrden, seguimiento = [] } = detalle
  // POST /api/envios/{id}/seguimiento: hasAuthority('ORDENES_GESTIONAR')
  const puedeRegistrar = tienePermiso('ORDENES_GESTIONAR') && envio.estadoEnvio !== 'ENTREGADO'

  const alRegistrar = (nuevo) => {
    setDetalle(nuevo)
    setFormAbierto(false)
    setAviso('Evento registrado. El cliente ya puede ver el nuevo estado.')
    setTimeout(() => setAviso(''), 4000)
  }
  const ultimo = seguimiento[seguimiento.length - 1]
  const arribo = resumenArribo(envio)

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Envío #{envio.idEnvio} · Orden {numeroOrden}</span>
          <h1 className="titulo-con-badge">
            {envio.puertoOrigen} → {envio.puertoDestino} <EstadoBadge estado={envio.estadoEnvio} />
          </h1>
          <p className={`texto-${arribo.tono} resumen-arribo`}><Icono nombre="reloj" tam={16} /> {arribo.texto}</p>
        </div>
        <div className="acciones">
          <button className="boton boton--secundario" onClick={onRecargar}>
            <Icono nombre="recargar" tam={16} /> Actualizar
          </button>
          {puedeRegistrar && (
            <button className="boton boton--primario" onClick={() => setFormAbierto(true)}>
              <Icono nombre="pin" tam={16} /> Registrar evento
            </button>
          )}
        </div>
      </header>

      {aviso && <div className="aviso aviso--exito" role="status"><Icono nombre="check" tam={16} /> {aviso}</div>}
      {formAbierto && <RegistrarEvento envio={envio} onCerrar={() => setFormAbierto(false)} onRegistrado={alRegistrar} />}

      {envio.estadoEnvio === 'INCIDENCIA' && ultimo && (
        <div className="aviso aviso--alerta aviso--grande" role="alert">
          <Icono nombre="alerta" tam={20} />
          <div>
            <strong>El envío reporta una incidencia</strong>
            <p>{ultimo.observacion || 'Nuestro equipo de logística está atendiendo la novedad.'} ({ultimo.ubicacion}, {formatoFechaHora(ultimo.fechaEvento)})</p>
          </div>
        </div>
      )}

      <section className="tarjeta">
        <div className="tarjeta__cabecera">
          <div>
            <h2>Ubicación actual</h2>
            <p className="texto-suave">
              {ultimo ? <>Último reporte: <strong>{ultimo.ubicacion}</strong>, {formatoFechaHora(ultimo.fechaEvento)}</> : 'Aún no hay reportes de ubicación.'}
            </p>
          </div>
        </div>
        <RutaEnvio envio={envio} ubicacionActual={ultimo?.ubicacion} />
        <PasosEnvio estado={envio.estadoEnvio} seguimiento={seguimiento} />
      </section>

      <div className="rejilla-detalle">
        <section className="tarjeta">
          <h2>Datos del envío</h2>
          <div className="datos">
            <Dato icono="documento" etiqueta="Orden de exportación" valor={<Link className="enlace" to={`/ordenes/${envio.idOrden}`}>{numeroOrden}</Link>} />
            <Dato icono="barco" etiqueta="Transportista" valor={transportista} />
            <Dato icono="contenedor" etiqueta="Contenedor (ISO 6346)" valor={envio.numeroContenedor} mono />
            <Dato icono="documento" etiqueta="Booking / BL" valor={envio.bookingBl} mono />
            <Dato icono="ancla" etiqueta="Puerto de origen" valor={envio.puertoOrigen} />
            <Dato icono="pin" etiqueta="Puerto de destino" valor={envio.puertoDestino} />
            <Dato icono="calendario" etiqueta="Zarpe estimado" valor={formatoFecha(envio.fechaEstimadaZarpe)} />
            <Dato icono="calendario" etiqueta="Arribo estimado" valor={formatoFecha(envio.fechaEstimadaArribo)} />
          </div>
        </section>

        <section className="tarjeta">
          <h2>Bitácora de seguimiento</h2>
          {seguimiento.length === 0 ? (
            <Vacio titulo="Sin eventos" texto="El envío todavía no tiene eventos registrados." icono="reloj" />
          ) : (
            <Bitacora eventos={seguimiento} />
          )}
        </section>
      </div>
    </>
  )
}
