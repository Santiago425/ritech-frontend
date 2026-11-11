import { useState } from 'react'
import { ordenesApi, transportistasApi } from '../api/cliente.js'
import { useCarga } from '../hooks.js'
import Icono from './Icono.jsx'
import Modal from './Modal.jsx'

// Mismo patrón que valida el backend (EnvioSolicitud): ISO 6346.
const CONTENEDOR = /^[A-Z]{4}[0-9]{7}$/
const PUERTOS_ORIGEN = ['Buenaventura', 'Cartagena', 'Santa Marta', 'Barranquilla', 'Aeropuerto El Dorado (Bogotá)']
const PUERTOS_DESTINO = ['Hamburgo', 'Róterdam', 'Amberes', 'Valencia', 'Barcelona', 'Le Havre', 'Génova', 'Trieste', 'Bremerhaven', 'Algeciras']

const hoyIso = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const TIPOS = { NAVIERA: 'Naviera', AEREA: 'Aérea', TERRESTRE: 'Terrestre' }

/** SCRUM-28: programar el envío de una orden CONFIRMADA. */
export default function ProgramarEnvio({ orden, destinoSugerido, onCerrar, onProgramado }) {
  const transportistas = useCarga(() => transportistasApi.listar())
  const [form, setForm] = useState({
    idTransportista: '',
    numeroContenedor: '',
    bookingBl: '',
    puertoOrigen: 'Buenaventura',
    puertoDestino: destinoSugerido ?? '',
    fechaEstimadaZarpe: '',
    fechaEstimadaArribo: '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo, transformar = (v) => v) => (e) => {
    setForm((f) => ({ ...f, [campo]: transformar(e.target.value) }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const transportista = (transportistas.datos ?? []).find((t) => String(t.idTransportista) === String(form.idTransportista))
  const esMaritimo = !transportista || transportista.tipo === 'NAVIERA'

  const dias = form.fechaEstimadaZarpe && form.fechaEstimadaArribo
    ? Math.round((new Date(form.fechaEstimadaArribo) - new Date(form.fechaEstimadaZarpe)) / 86400000)
    : null

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = {}
    if (!form.idTransportista) er.idTransportista = 'Elige el transportista.'
    if (form.numeroContenedor && !CONTENEDOR.test(form.numeroContenedor)) er.numeroContenedor = '4 letras mayúsculas y 7 dígitos (ISO 6346). Ej. MSKU1234567'
    if (!form.puertoOrigen.trim()) er.puertoOrigen = 'Indica el puerto de origen.'
    if (!form.puertoDestino.trim()) er.puertoDestino = 'Indica el puerto de destino.'
    if (form.fechaEstimadaZarpe && form.fechaEstimadaZarpe < hoyIso()) er.fechaEstimadaZarpe = 'El zarpe no puede ser en el pasado.'
    if (dias !== null && dias < 0) er.fechaEstimadaArribo = 'El arribo no puede ser antes del zarpe.'
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    const cuerpo = {
      idTransportista: Number(form.idTransportista),
      numeroContenedor: form.numeroContenedor || null,
      bookingBl: form.bookingBl.trim() || null,
      puertoOrigen: form.puertoOrigen.trim(),
      puertoDestino: form.puertoDestino.trim(),
      fechaEstimadaZarpe: form.fechaEstimadaZarpe || null,
      fechaEstimadaArribo: form.fechaEstimadaArribo || null,
    }
    try {
      onProgramado(await ordenesApi.programarEnvio(orden.idOrden, cuerpo))
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
      setGuardando(false)
    }
  }

  const error = (c) => errores[c] && <span className="campo__error">{errores[c]}</span>

  return (
    <Modal
      ancho
      titulo="Programar envío"
      subtitulo={`Orden ${orden.numeroOrden} · Incoterm ${orden.incoterm}`}
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando || !transportistas.datos}>
            {guardando ? <span className="spinner spinner--claro" /> : 'Programar envío'}
          </button>
        </>
      }
    >
      <label className="campo">
        <span>Transportista</span>
        <select value={form.idTransportista} onChange={cambiar('idTransportista')} aria-invalid={!!errores.idTransportista} autoFocus disabled={!transportistas.datos}>
          <option value="">{transportistas.cargando ? 'Cargando…' : 'Selecciona…'}</option>
          {(transportistas.datos ?? []).map((t) => <option key={t.idTransportista} value={t.idTransportista}>{t.nombre} · {TIPOS[t.tipo] ?? t.tipo}</option>)}
        </select>
        {error('idTransportista')}
        {transportistas.error && <span className="campo__error">{transportistas.error.message}</span>}
        {transportista?.contacto && <span className="campo__nota">Contacto: {transportista.contacto}</span>}
      </label>

      <div className="rejilla-campos">
        <label className="campo">
          <span>Contenedor {!esMaritimo ? <em className="texto-suave">(no aplica)</em> : <em className="texto-suave">(opcional)</em>}</span>
          <input className="mono" value={form.numeroContenedor} onChange={cambiar('numeroContenedor', (v) => v.toUpperCase().replace(/\s/g, ''))} maxLength={11} placeholder="MSKU1234567" disabled={!esMaritimo} aria-invalid={!!errores.numeroContenedor} />
          {error('numeroContenedor')}
          {!errores.numeroContenedor && esMaritimo && <span className="campo__nota">Si aún no lo asignan, lo puedes dejar vacío.</span>}
        </label>
        <label className="campo">
          <span>{esMaritimo ? 'Booking / BL' : 'Guía / AWB'} <em className="texto-suave">(opcional)</em></span>
          <input className="mono" value={form.bookingBl} onChange={cambiar('bookingBl')} maxLength={40} placeholder="BK-2026-55012" aria-invalid={!!errores.bookingBl} />
          {error('bookingBl')}
        </label>
      </div>

      <div className="rejilla-campos">
        <label className="campo">
          <span>Origen</span>
          <input list="puertos-origen" value={form.puertoOrigen} onChange={cambiar('puertoOrigen')} maxLength={80} aria-invalid={!!errores.puertoOrigen} />
          <datalist id="puertos-origen">{PUERTOS_ORIGEN.map((p) => <option key={p} value={p} />)}</datalist>
          {error('puertoOrigen')}
        </label>
        <label className="campo">
          <span>Destino (UE)</span>
          <input list="puertos-destino" value={form.puertoDestino} onChange={cambiar('puertoDestino')} maxLength={80} placeholder="Ej. Hamburgo" aria-invalid={!!errores.puertoDestino} />
          <datalist id="puertos-destino">{PUERTOS_DESTINO.map((p) => <option key={p} value={p} />)}</datalist>
          {error('puertoDestino')}
        </label>
      </div>

      <div className="rejilla-campos">
        <label className="campo">
          <span>Zarpe estimado</span>
          <input type="date" min={hoyIso()} value={form.fechaEstimadaZarpe} onChange={cambiar('fechaEstimadaZarpe')} aria-invalid={!!errores.fechaEstimadaZarpe} />
          {error('fechaEstimadaZarpe')}
        </label>
        <label className="campo">
          <span>Arribo estimado</span>
          <input type="date" min={form.fechaEstimadaZarpe || hoyIso()} value={form.fechaEstimadaArribo} onChange={cambiar('fechaEstimadaArribo')} aria-invalid={!!errores.fechaEstimadaArribo} />
          {error('fechaEstimadaArribo')}
          {!errores.fechaEstimadaArribo && dias !== null && dias >= 0 && <span className="campo__nota">Tránsito estimado: {dias} {dias === 1 ? 'día' : 'días'}.</span>}
        </label>
      </div>

      <p className="campo__nota">Al programarlo, el cliente ya puede seguir el envío desde su cuenta. Cuando registres el evento "En tránsito", la orden pasa a en tránsito y sus lotes quedan como exportados.</p>

      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
