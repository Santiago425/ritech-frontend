import { useMemo, useState } from 'react'
import { cumplimientoApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import { useCarga } from '../hooks.js'
import { diasHasta, formatoFecha, formatoFechaHora } from '../utils.js'
import CertificadoForm from './CertificadoForm.jsx'
import { Cargando, ErrorCaja, Vacio } from './Estados.jsx'
import Icono from './Icono.jsx'

export const DICTAMENES = {
  CUMPLE: { etiqueta: 'Cumple', tono: 'exito', texto: 'El lote cumple todas las reglas normativas de la UE evaluadas.' },
  NO_CUMPLE: { etiqueta: 'No cumple', tono: 'alerta', texto: 'El lote incumple una o más reglas y no puede asignarse a una orden.' },
  SIN_VALIDAR: { etiqueta: 'Sin validar', tono: 'neutro', texto: 'El lote todavía no se ha validado contra las reglas de la UE.' },
}

const PARAMETROS = {
  geolocalizacion_fincas: 'Fincas geolocalizadas (%)',
  poligono_si_area_mayor_4ha: 'Polígono en fincas > 4 ha',
  suma_aportes_finca: 'Suma de aportes (%)',
  ocratoxina_a_cafe: 'Ocratoxina A (µg/kg)',
  aflatoxinas_cacao: 'Aflatoxinas (µg/kg)',
  humedad_cafe_verde: 'Humedad (%)',
  certificado_fitosanitario_vigente: 'Fitosanitario vigente',
  eori_importador_valido: 'EORI del importador válido',
}
export const nombreParametro = (p) => PARAMETROS[p] ?? p

const valorLegible = (v) => (v == null ? 'Sin dato' : v === 'true' || v === '1' ? 'Sí' : v === 'false' || v === '0' ? 'No' : v)

function estadoCertificado(c) {
  const dias = diasHasta(c.fechaVencimiento)
  if (c.estadoValidacion === 'RECHAZADO') return { etiqueta: 'Rechazado', tono: 'alerta', nota: null }
  if (c.estadoValidacion === 'VENCIDO' || dias < 0) return { etiqueta: 'Vencido', tono: 'alerta', nota: `Venció hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}` }
  if (dias <= 30) return { etiqueta: 'Por vencer', tono: 'aviso', nota: dias === 0 ? 'Vence hoy' : `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}` }
  return { etiqueta: 'Vigente', tono: 'exito', nota: `Vence en ${dias} días` }
}

/** SCRUM-20 y SCRUM-22: certificados del lote y dictamen de cumplimiento normativo UE. */
export default function CumplimientoLote({ lote }) {
  const { tienePermiso } = useSesion()
  const puedeCargar = tienePermiso('CERTIFICADOS_CARGAR')
  const puedeValidar = tienePermiso('VALIDACION_EJECUTAR')

  const dictamen = useCarga(() => cumplimientoApi.dictamen(lote.idLote), [lote.idLote])
  const certificados = useCarga(() => cumplimientoApi.certificados(lote.idLote), [lote.idLote])
  const tipos = useCarga(() => cumplimientoApi.tiposCertificado())
  const [validando, setValidando] = useState(false)
  const [errorValidar, setErrorValidar] = useState('')
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState('')

  const tipo = useMemo(() => {
    const m = new Map((tipos.datos ?? []).map((t) => [t.idCertificacion, t]))
    return (id) => m.get(id)
  }, [tipos.datos])

  const lista = certificados.datos ?? []
  const faltantes = (tipos.datos ?? []).filter((t) => t.obligatoriaUe && !lista.some((c) => c.idCertificacion === t.idCertificacion && estadoCertificado(c).tono !== 'alerta'))

  const validar = async () => {
    setValidando(true)
    setErrorValidar('')
    try {
      await cumplimientoApi.validar(lote.idLote)
      dictamen.recargar()
    } catch (err) {
      setErrorValidar(err.message)
    } finally {
      setValidando(false)
    }
  }

  const verSoporte = async (c) => {
    const ventana = window.open('', '_blank')
    try {
      const blob = await cumplimientoApi.descargarSoporte(lote.idLote, c.idCertificacion)
      const url = URL.createObjectURL(blob)
      if (ventana) ventana.location.href = url
      else window.location.href = url
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      ventana?.close()
      setAviso(`No se pudo abrir el soporte: ${err.message}`)
    }
  }

  const alGuardar = (_, texto) => {
    setModal(null)
    certificados.recargar()
    setAviso(texto)
    setTimeout(() => setAviso(''), 5000)
  }

  const d = dictamen.datos
  const info = d ? DICTAMENES[d.dictamen] ?? DICTAMENES.SIN_VALIDAR : null

  return (
    <>
      <section className="tarjeta">
        <div className="tarjeta__cabecera">
          <div>
            <h2>Dictamen normativo UE</h2>
            <p className="texto-suave">EUDR, contaminantes, humedad y certificado fitosanitario, regla por regla.</p>
          </div>
          {puedeValidar && (
            <button className="boton boton--primario" onClick={validar} disabled={validando}>
              {validando ? <span className="spinner spinner--claro" /> : <><Icono nombre="recargar" tam={16} /> {d?.dictamen === 'SIN_VALIDAR' ? 'Validar lote' : 'Validar de nuevo'}</>}
            </button>
          )}
        </div>
        {errorValidar && <div className="aviso aviso--error espacio-abajo" role="alert"><Icono nombre="alerta" tam={16} /> {errorValidar}</div>}

        {dictamen.cargando && !d ? (
          <Cargando texto="Consultando dictamen…" />
        ) : dictamen.error ? (
          <ErrorCaja error={dictamen.error} onReintentar={dictamen.recargar} />
        ) : (
          <>
            <div className={`dictamen dictamen--${info.tono}`}>
              <span className="dictamen__icono"><Icono nombre={d.dictamen === 'CUMPLE' ? 'check' : d.dictamen === 'NO_CUMPLE' ? 'alerta' : 'reloj'} tam={22} /></span>
              <div>
                <strong>{info.etiqueta}</strong>
                <p>{info.texto}</p>
              </div>
              {d.ultimaValidacion && (
                <div className="dictamen__datos">
                  <span>{d.reglasEvaluadas - d.reglasIncumplidas} de {d.reglasEvaluadas} reglas</span>
                  <span className="texto-suave">{formatoFechaHora(d.ultimaValidacion)}</span>
                </div>
              )}
            </div>
            {d.detalle.length > 0 && (
              <ul className="reglas-lote">
                {d.detalle.map((r) => (
                  <li key={r.codigoRegla} className={`regla-lote regla-lote--${r.resultado === 'CUMPLE' ? 'ok' : 'falla'}`}>
                    <span className="regla-lote__marca"><Icono nombre={r.resultado === 'CUMPLE' ? 'check' : 'alerta'} tam={14} /></span>
                    <div className="regla-lote__texto">
                      <strong>{nombreParametro(r.parametro)}</strong>
                      <span className="celda-sub"><span className="mono">{r.codigoRegla}</span> · {r.normativa}</span>
                      {r.mensaje && <span className="regla-lote__mensaje">{r.mensaje}</span>}
                    </div>
                    <div className="regla-lote__valor">
                      <strong>{valorLegible(r.valorEvaluado)}</strong>
                      <span className="celda-sub">límite {r.operador} {valorLegible(r.valorLimite)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section className="tarjeta">
        <div className="tarjeta__cabecera">
          <div>
            <h2>Certificados</h2>
            <p className="texto-suave">Documentos del lote con su vigencia. El fitosanitario y el de origen son obligatorios para la UE.</p>
          </div>
          {puedeCargar && (
            <button className="boton boton--secundario" onClick={() => setModal({})} disabled={!tipos.datos}>+ Cargar certificado</button>
          )}
        </div>
        {aviso && <div className={`aviso aviso--${aviso.startsWith('No se pudo') || aviso.includes('no se pudo') ? 'alerta' : 'exito'} espacio-abajo`} role="status"><Icono nombre="check" tam={16} /> {aviso}</div>}
        {faltantes.length > 0 && !certificados.cargando && (
          <div className="aviso aviso--alerta espacio-abajo" role="status">
            <Icono nombre="alerta" tam={16} /> Falta {faltantes.map((t) => t.nombre.toLowerCase()).join(' y ')} vigente.
          </div>
        )}

        {certificados.cargando && !certificados.datos ? (
          <Cargando texto="Cargando certificados…" />
        ) : certificados.error ? (
          <ErrorCaja error={certificados.error} onReintentar={certificados.recargar} />
        ) : lista.length === 0 ? (
          <Vacio icono="documento" titulo="Sin certificados" texto={puedeCargar ? 'Carga el certificado fitosanitario y el de origen.' : null} />
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla tabla--compacta">
              <thead>
                <tr><th>Certificado</th><th>Documento</th><th>Vigencia</th><th>Estado</th><th aria-label="Acciones" /></tr>
              </thead>
              <tbody>
                {lista.map((c) => {
                  const t = tipo(c.idCertificacion)
                  const e = estadoCertificado(c)
                  return (
                    <tr key={c.idCertificacion} className="tabla__fila--fija">
                      <td data-etiqueta="Certificado">
                        <strong>{t?.nombre ?? `Tipo #${c.idCertificacion}`}</strong>
                        {t && <span className="celda-sub">{t.entidadEmisora}{t.obligatoriaUe ? ' · obligatorio UE' : ''}</span>}
                      </td>
                      <td data-etiqueta="Documento" className="mono">{c.numeroDocumento}</td>
                      <td data-etiqueta="Vigencia" className="celda-vigencia">
                        {formatoFecha(c.fechaEmision)} → {formatoFecha(c.fechaVencimiento)}
                        {e.nota && <span className={`celda-sub ${e.tono !== 'exito' ? 'texto-alerta' : ''}`}>{e.nota}</span>}
                      </td>
                      <td data-etiqueta="Estado"><span className={`badge badge--${e.tono === 'aviso' ? 'alerta' : e.tono}`}>{e.etiqueta}</span></td>
                      <td className="celda-accion">
                        {c.urlSoporte && <button className="boton boton--fantasma" onClick={() => verSoporte(c)}>Ver soporte</button>}
                        {puedeCargar && !c.urlSoporte && <button className="boton boton--fantasma" onClick={() => setModal({ inicial: c, soloSoporte: true })}>Adjuntar</button>}
                        {puedeCargar && e.tono !== 'exito' && <button className="boton boton--fantasma" onClick={() => setModal({ inicial: c })}>Renovar</button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && tipos.datos && (
        <CertificadoForm
          lote={lote}
          tipos={tipos.datos}
          existentes={lista}
          inicial={modal.inicial}
          soloSoporte={modal.soloSoporte}
          onCerrar={() => setModal(null)}
          onGuardado={alGuardar}
        />
      )}
    </>
  )
}
