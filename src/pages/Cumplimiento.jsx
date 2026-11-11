import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cumplimientoApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import { nombreParametro } from '../components/CumplimientoLote.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import Icono from '../components/Icono.jsx'
import ReglaForm from '../components/ReglaForm.jsx'
import { useCarga } from '../hooks.js'
import { formatoFecha } from '../utils.js'

const TIPOS = { AMBOS: 'Café y cacao', CAFE: 'Café', CACAO: 'Cacao' }

/** SCRUM-23: certificados que están por vencer. */
function Alertas() {
  const [dias, setDias] = useState(30)
  const alertas = useCarga(() => cumplimientoApi.porVencer(dias), [dias])
  const lista = alertas.datos ?? []
  const urgentes = lista.filter((a) => a.diasRestantes <= 7).length

  return (
    <section className="tarjeta">
      <div className="tarjeta__cabecera">
        <div>
          <h2>Certificados por vencer</h2>
          <p className="texto-suave">Certificados vigentes que vencen pronto. Cada día el sistema marca como vencidos los que ya pasaron su fecha.</p>
        </div>
        <div className="filtros__chips" role="group" aria-label="Horizonte">
          {[15, 30, 60, 90].map((d) => (
            <button key={d} className={`chip ${dias === d ? 'chip--activo' : ''}`} onClick={() => setDias(d)}>{d} días</button>
          ))}
        </div>
      </div>
      {urgentes > 0 && (
        <div className="aviso aviso--alerta espacio-abajo" role="status">
          <Icono nombre="alerta" tam={16} /> {urgentes} {urgentes === 1 ? 'certificado vence' : 'certificados vencen'} en 7 días o menos.
        </div>
      )}
      {alertas.cargando && !alertas.datos ? (
        <Cargando texto="Buscando certificados por vencer…" />
      ) : alertas.error ? (
        <ErrorCaja error={alertas.error} onReintentar={alertas.recargar} />
      ) : lista.length === 0 ? (
        <Vacio icono="check" titulo="Todo al día" texto={`Ningún certificado vence en los próximos ${dias} días.`} />
      ) : (
        <ul className="alertas">
          {lista.map((a) => (
            <li key={`${a.idLote}-${a.numeroDocumento}`}>
              <Link to={`/lotes/${a.idLote}?ver=cumplimiento`} className={`alerta alerta--${a.diasRestantes <= 7 ? 'urgente' : a.diasRestantes <= 30 ? 'pronto' : 'normal'}`}>
                <span className="alerta__dias"><strong>{a.diasRestantes}</strong>{a.diasRestantes === 1 ? 'día' : 'días'}</span>
                <div className="alerta__texto">
                  <strong>{a.certificado}</strong>
                  <span className="celda-sub">Lote <span className="mono">{a.codigoLote}</span> · Doc. <span className="mono">{a.numeroDocumento}</span></span>
                </div>
                <span className="alerta__fecha">Vence {formatoFecha(a.fechaVencimiento)}</span>
                <Icono nombre="flecha" tam={16} className="alerta__flecha" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** SCRUM-21: reglas normativas de la UE que aplica el motor de validación. */
function Reglas() {
  const { tienePermiso } = useSesion()
  const puedeAdministrar = tienePermiso('REGLAS_ADMINISTRAR')
  const reglas = useCarga(() => cumplimientoApi.reglas())
  const parametros = useCarga(() => (puedeAdministrar ? cumplimientoApi.parametros() : Promise.resolve({})))
  const [formulario, setFormulario] = useState(null)
  const [cambiando, setCambiando] = useState(null)
  const [aviso, setAviso] = useState(null)

  const avisar = (tono, texto) => {
    setAviso({ tono, texto })
    setTimeout(() => setAviso(null), 5000)
  }

  const alternar = async (r) => {
    setCambiando(r.idRegla)
    try {
      await cumplimientoApi.activarRegla(r.idRegla, !r.activa)
      reglas.recargar()
      avisar('exito', `${r.codigoRegla} ${r.activa ? 'desactivada' : 'activada'}. Se aplica desde la próxima validación.`)
    } catch (err) {
      avisar('error', err.message)
    } finally {
      setCambiando(null)
    }
  }

  const lista = reglas.datos ?? []
  const siguiente = `R-UE-${String(Math.max(0, ...lista.map((r) => Number(r.codigoRegla.slice(5)) || 0)) + 1).padStart(3, '0')}`

  return (
    <section className="tarjeta">
      <div className="tarjeta__cabecera">
        <div>
          <h2>Reglas normativas</h2>
          <p className="texto-suave">{lista.filter((r) => r.activa).length} de {lista.length} activas. Un lote solo se puede exportar si cumple todas las que le aplican.</p>
        </div>
        {puedeAdministrar && (
          <button className="boton boton--primario" onClick={() => setFormulario('nueva')} disabled={!parametros.datos}>+ Nueva regla</button>
        )}
      </div>
      {aviso && <div className={`aviso aviso--${aviso.tono} espacio-abajo`} role="status"><Icono nombre={aviso.tono === 'error' ? 'alerta' : 'check'} tam={16} /> {aviso.texto}</div>}
      {reglas.cargando && !reglas.datos ? (
        <Cargando texto="Cargando reglas…" />
      ) : reglas.error ? (
        <ErrorCaja error={reglas.error} onReintentar={reglas.recargar} />
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla tabla--compacta">
            <thead>
              <tr><th>Regla</th><th>Condición</th><th>Aplica a</th><th>Estado</th>{puedeAdministrar && <th aria-label="Acciones" />}</tr>
            </thead>
            <tbody>
              {lista.map((r) => (
                <tr key={r.idRegla} className={`tabla__fila--fija ${r.activa ? '' : 'fila--apagada'}`}>
                  <td data-etiqueta="Regla" className="celda-regla">
                    <strong className="mono">{r.codigoRegla}</strong>
                    <span className="celda-sub">{r.normativaReferencia}</span>
                    <span className="celda-sub">{r.mensajeError}</span>
                  </td>
                  <td data-etiqueta="Condición" className="nowrap">
                    {nombreParametro(r.parametro)} <span className="mono condicion">{r.operador} {r.valorLimite}</span>
                    {r.ambito === 'ORDEN' && <span className="celda-sub">Se evalúa al asignar a una orden</span>}
                  </td>
                  <td data-etiqueta="Aplica a">{TIPOS[r.aplicaTipo] ?? r.aplicaTipo}</td>
                  <td data-etiqueta="Estado">
                    {puedeAdministrar ? (
                      <button className={`interruptor ${r.activa ? 'interruptor--on' : ''}`} role="switch" aria-checked={r.activa} onClick={() => alternar(r)} disabled={cambiando === r.idRegla}>
                        <span /> {r.activa ? 'Activa' : 'Inactiva'}
                      </button>
                    ) : (
                      <span className={`badge badge--${r.activa ? 'exito' : 'neutro'}`}>{r.activa ? 'Activa' : 'Inactiva'}</span>
                    )}
                  </td>
                  {puedeAdministrar && (
                    <td className="celda-accion">
                      <button className="boton boton--fantasma" onClick={() => setFormulario(r)} disabled={!parametros.datos}>Editar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {formulario && parametros.datos && (
        <ReglaForm
          regla={formulario === 'nueva' ? null : formulario}
          parametros={parametros.datos}
          siguienteCodigo={siguiente}
          onCerrar={() => setFormulario(null)}
          onGuardada={(r, editada) => {
            setFormulario(null)
            reglas.recargar()
            avisar('exito', editada ? `Regla ${r.codigoRegla} actualizada.` : `Regla ${r.codigoRegla} creada.`)
          }}
        />
      )}
    </section>
  )
}

/** SCRUM-21 y SCRUM-23: alertas de certificados y reglas normativas UE. */
export default function Cumplimiento() {
  const { tienePermiso } = useSesion()
  const verAlertas = tienePermiso('CERTIFICADOS_CARGAR') || tienePermiso('ORDENES_GESTIONAR')
  const verReglas = tienePermiso('REGLAS_ADMINISTRAR') || tienePermiso('VALIDACION_EJECUTAR')
  const [params, setParams] = useSearchParams()
  const pestana = params.get('ver') === 'reglas' || !verAlertas ? 'reglas' : 'alertas'

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Normativa</span>
          <h1>Cumplimiento UE</h1>
          <p className="texto-suave">Vencimiento de certificados y reglas del Reglamento EUDR y de contaminantes que se exigen para exportar.</p>
        </div>
      </header>

      {verAlertas && verReglas && (
        <div className="pestanas" role="tablist">
          <button role="tab" aria-selected={pestana === 'alertas'} className={pestana === 'alertas' ? 'activa' : ''} onClick={() => setParams({})}>
            <Icono nombre="reloj" tam={16} /> Alertas de vencimiento
          </button>
          <button role="tab" aria-selected={pestana === 'reglas'} className={pestana === 'reglas' ? 'activa' : ''} onClick={() => setParams({ ver: 'reglas' })}>
            <Icono nombre="documento" tam={16} /> Reglas normativas
          </button>
        </div>
      )}

      {pestana === 'alertas' ? <Alertas /> : <Reglas />}
    </div>
  )
}
