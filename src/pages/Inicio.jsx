import { Link } from 'react-router-dom'
import { enviosApi } from '../api/cliente.js'
import { NOMBRE_ROL, useSesion } from '../auth/SesionContext.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'
import { Cargando, ErrorCaja } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import Tablero from '../components/Tablero.jsx'
import { useCarga } from '../hooks.js'
import { diasHasta, formatoFecha, resumenArribo } from '../utils.js'

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

function Indicador({ titulo, valor, icono, tono }) {
  return (
    <div className={`indicador indicador--${tono}`}>
      <span className="indicador__icono"><Icono nombre={icono} tam={20} /></span>
      <div>
        <span className="indicador__titulo">{titulo}</span>
        <strong className="indicador__valor">{valor}</strong>
      </div>
    </div>
  )
}

function ResumenEnvios() {
  const { esCliente } = useSesion()
  const { datos: envios, error, cargando, recargar } = useCarga(() => enviosApi.listar())

  if (cargando) return <Cargando texto="Cargando tus envíos…" />
  if (error) return <ErrorCaja error={error} onReintentar={recargar} />

  const contar = (...estados) => envios.filter((e) => estados.includes(e.estadoEnvio)).length
  const activos = envios
    .filter((e) => e.estadoEnvio !== 'ENTREGADO')
    .sort((a, b) => (diasHasta(a.fechaEstimadaArribo) ?? 9999) - (diasHasta(b.fechaEstimadaArribo) ?? 9999))
    .slice(0, 5)

  return (
    <>
      <div className="indicadores">
        <Indicador titulo="Envíos totales" valor={envios.length} icono="contenedor" tono="neutro" />
        <Indicador titulo="En tránsito" valor={contar('EN_PUERTO', 'EN_TRANSITO')} icono="barco" tono="primario" />
        <Indicador titulo="Entregados" valor={contar('ENTREGADO')} icono="check" tono="exito" />
        <Indicador titulo="Con incidencia" valor={contar('INCIDENCIA')} icono="alerta" tono="alerta" />
      </div>

      <section className="tarjeta">
        <div className="tarjeta__cabecera">
          <div>
            <h2>Próximos arribos</h2>
            <p className="texto-suave">{esCliente ? 'Tus envíos que aún no se han entregado.' : 'Envíos activos ordenados por fecha de arribo.'}</p>
          </div>
          <Link to="/envios" className="boton boton--secundario">Ver todos</Link>
        </div>
        {activos.length === 0 ? (
          <p className="texto-suave">No hay envíos activos en este momento.</p>
        ) : (
          <ul className="lista-arribos">
            {activos.map((e) => {
              const arribo = resumenArribo(e)
              return (
                <li key={e.idEnvio}>
                  <Link to={`/envios/${e.idEnvio}`}>
                    <div className="lista-arribos__ruta">
                      <strong>{e.puertoOrigen} → {e.puertoDestino}</strong>
                      <span>{e.bookingBl ?? `Envío #${e.idEnvio}`} · Arribo est. {formatoFecha(e.fechaEstimadaArribo)}</span>
                    </div>
                    <span className={`texto-${arribo.tono}`}>{arribo.texto}</span>
                    <EstadoBadge estado={e.estadoEnvio} />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}

export default function Inicio() {
  const { usuario, esCliente, puedeVerEnvios, tienePermiso } = useSesion()
  const nombre = usuario.nombreCompleto.split(' ')[0]

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</span>
          <h1>{saludo()}, {nombre}</h1>
          <p className="texto-suave">Este es el resumen de tu operación de hoy.</p>
        </div>
      </header>

      {tienePermiso('INSPECCION_REGISTRAR') && (
        <div className="aviso aviso--info">
          <span>Revisa los lotes pendientes de inspección.</span>
          <Link to="/lotes?estado=EN_INSPECCION" className="enlace">Ver lotes por inspeccionar</Link>
        </div>
      )}
      {!esCliente ? (
        <Tablero />
      ) : puedeVerEnvios ? (
        <ResumenEnvios />
      ) : (
        <section className="tarjeta">
          <h2>Bienvenido a RiTech Exports</h2>
          <p className="texto-suave espacio-abajo">Desde el menú lateral entras a los módulos de tu rol.</p>
          {tienePermiso('LOTES_CONSULTAR') && (
            <Link to={tienePermiso('INSPECCION_REGISTRAR') ? '/lotes?estado=EN_INSPECCION' : '/lotes'} className="boton boton--primario">
              {tienePermiso('INSPECCION_REGISTRAR') ? 'Ver lotes por inspeccionar' : 'Ver lotes'}
            </Link>
          )}
        </section>
      )}
    </div>
  )
}
