import { useState } from 'react'
import { lotesApi } from '../api/cliente.js'
import { formatoKg } from '../utils.js'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

const redondear = (n) => Math.round(n * 100) / 100

/**
 * SCRUM-16: asociar una finca de origen al lote con su porcentaje de aporte,
 * o editar el aporte de una ya asociada. Los kg se calculan del peso neto.
 */
export default function AporteForm({ lote, catalogo, aportes, aporte, onCerrar, onGuardado }) {
  const editando = Boolean(aporte)
  const fincaActual = editando ? catalogo.fincas.find((f) => f.idFinca === aporte.idFinca) : null
  const [idProductor, setIdProductor] = useState(fincaActual?.idProductor ?? '')
  const [idFinca, setIdFinca] = useState(aporte?.idFinca ?? '')
  const usado = aportes.filter((a) => a.idFinca !== aporte?.idFinca).reduce((s, a) => s + Number(a.porcentajeAporte), 0)
  const restante = redondear(100 - usado)
  const [porcentaje, setPorcentaje] = useState(aporte ? String(aporte.porcentajeAporte) : restante > 0 ? String(restante) : '')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const yaAsociadas = new Set(aportes.map((a) => a.idFinca))
  const fincasDelProductor = catalogo.fincas.filter((f) => String(f.idProductor) === String(idProductor))
  const finca = catalogo.fincas.find((f) => String(f.idFinca) === String(idFinca))
  const pct = Number(porcentaje)
  const kg = pct > 0 ? redondear((Number(lote.pesoNetoKg) * pct) / 100) : null
  const sinGeo = finca && (finca.latitud == null || finca.longitud == null)
  const sinPoligono = finca && Number(finca.areaHectareas) > 4 && !finca.poligonoGeojson

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = {}
    if (!editando && !finca) er.idFinca = 'Elige la finca de origen.'
    if (!(pct > 0) || pct > 100) er.porcentajeAporte = 'Debe ser mayor que 0 y hasta 100.'
    else if (pct > restante + 0.001) er.porcentajeAporte = `Solo queda ${restante}% por asignar.`
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    try {
      const guardado = editando
        ? await lotesApi.editarAporte(lote.idLote, aporte.idFinca, { porcentajeAporte: pct })
        : await lotesApi.agregarAporte(lote.idLote, { idFinca: finca.idFinca, porcentajeAporte: pct })
      onGuardado(guardado, editando ? `Se actualizó el aporte de ${fincaActual?.nombreFinca ?? 'la finca'}.` : `${finca.nombreFinca} quedó asociada al lote.`)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo={editando ? `Editar aporte de ${fincaActual?.nombreFinca ?? 'la finca'}` : 'Asociar finca de origen'}
      subtitulo={`Lote ${lote.codigoLote} · ${formatoKg(lote.pesoNetoKg)} netos`}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando}>
            {guardando ? <span className="spinner spinner--claro" /> : editando ? 'Guardar cambios' : 'Asociar finca'}
          </button>
        </>
      }
    >
      {!editando && (
        <div className="rejilla-campos">
          <label className="campo">
            <span>Productor</span>
            <select value={idProductor} onChange={(e) => { setIdProductor(e.target.value); setIdFinca(''); setErrores({}) }} autoFocus>
              <option value="">Selecciona…</option>
              {catalogo.productores.map((p) => <option key={p.idProductor} value={p.idProductor}>{p.nombre}</option>)}
            </select>
          </label>
          <label className="campo">
            <span>Finca</span>
            <select value={idFinca} onChange={(e) => { setIdFinca(e.target.value); setErrores({}) }} disabled={!idProductor} aria-invalid={!!errores.idFinca}>
              <option value="">{idProductor && fincasDelProductor.length === 0 ? 'Sin fincas registradas' : 'Selecciona…'}</option>
              {fincasDelProductor.map((f) => (
                <option key={f.idFinca} value={f.idFinca} disabled={yaAsociadas.has(f.idFinca)}>
                  {f.nombreFinca} · {f.areaHectareas} ha{yaAsociadas.has(f.idFinca) ? ' (ya asociada)' : ''}
                </option>
              ))}
            </select>
            {errores.idFinca && <span className="campo__error">{errores.idFinca}</span>}
          </label>
        </div>
      )}

      {(sinGeo || sinPoligono) && (
        <div className="aviso aviso--alerta" role="status">
          <Icono nombre="alerta" tam={16} />
          {sinGeo ? 'Esta finca no tiene coordenadas: el lote no cumplirá la regla EUDR de geolocalización.' : 'La finca mide más de 4 ha y no tiene polígono: el lote no cumplirá la regla EUDR.'}
        </div>
      )}

      <div className="rejilla-campos">
        <label className="campo">
          <span>Porcentaje de aporte</span>
          <input type="number" min="0.01" max="100" step="0.01" value={porcentaje} onChange={(e) => { setPorcentaje(e.target.value); setErrores((x) => ({ ...x, porcentajeAporte: undefined })) }} aria-invalid={!!errores.porcentajeAporte} autoFocus={editando} />
          {errores.porcentajeAporte && <span className="campo__error">{errores.porcentajeAporte}</span>}
          {!errores.porcentajeAporte && <span className="campo__nota">Disponible: {restante}% del lote.</span>}
        </label>
        <div className="campo">
          <span>Kg que aporta</span>
          <div className="campo__calculado">{kg ? formatoKg(kg) : '—'}</div>
          <span className="campo__nota">Se calcula sobre el peso neto.</span>
        </div>
      </div>

      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
