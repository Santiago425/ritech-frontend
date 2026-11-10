import { useState } from 'react'
import { productoresApi } from '../api/cliente.js'
import { LIMITE_HA_SIN_POLIGONO, areaHectareas, centroDe, leerPoligono, poligonoDesde, redondear, verticesDe } from '../geo.js'
import Icono from './Icono.jsx'
import Mapa from './Mapa.jsx'
import Modal from './Modal.jsx'

function hoy() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** SCRUM-14: registrar o editar una finca con geolocalización y polígono (EUDR). */
export default function FincaForm({ idProductor, finca, onCerrar, onGuardado }) {
  const editando = Boolean(finca)
  const [form, setForm] = useState({
    nombreFinca: finca?.nombreFinca ?? '',
    areaHectareas: finca?.areaHectareas != null ? String(finca.areaHectareas) : '',
    latitud: finca?.latitud != null ? String(finca.latitud) : '',
    longitud: finca?.longitud != null ? String(finca.longitud) : '',
    fechaVerificacionDeforestacion: finca?.fechaVerificacionDeforestacion ?? '',
  })
  const [vertices, setVertices] = useState(() => verticesDe(leerPoligono(finca?.poligonoGeojson)))
  const [modo, setModo] = useState('punto')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const area = Number(form.areaHectareas)
  const requierePoligono = area > LIMITE_HA_SIN_POLIGONO
  const areaPoligono = areaHectareas(vertices)
  const lat = Number(form.latitud)
  const lng = Number(form.longitud)
  const hayPunto = form.latitud !== '' && form.longitud !== '' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const alClicMapa = ([la, ln]) => {
    if (modo === 'punto') {
      setForm((f) => ({ ...f, latitud: String(redondear(la)), longitud: String(redondear(ln)) }))
      setErrores((er) => ({ ...er, latitud: undefined, longitud: undefined }))
    } else {
      setVertices((v) => [...v, [la, ln]])
      setErrores((er) => ({ ...er, poligonoGeojson: undefined }))
    }
  }

  const usarCentroDelPoligono = () => {
    const c = centroDe(vertices)
    if (c) setForm((f) => ({ ...f, latitud: String(redondear(c[0])), longitud: String(redondear(c[1])) }))
  }

  const validar = () => {
    const er = {}
    if (!form.nombreFinca.trim()) er.nombreFinca = 'El nombre de la finca es obligatorio.'
    if (!form.areaHectareas) er.areaHectareas = 'Indica el área.'
    else if (!(area > 0)) er.areaHectareas = 'El área debe ser mayor que cero.'
    if (form.latitud === '' || Number.isNaN(lat) || lat < -90 || lat > 90) er.latitud = 'Latitud entre -90 y 90.'
    if (form.longitud === '' || Number.isNaN(lng) || lng < -180 || lng > 180) er.longitud = 'Longitud entre -180 y 180.'
    if (vertices.length > 0 && vertices.length < 3) er.poligonoGeojson = 'El polígono necesita al menos 3 puntos.'
    else if (requierePoligono && vertices.length < 3) er.poligonoGeojson = `Las fincas de más de ${LIMITE_HA_SIN_POLIGONO} ha requieren el polígono (EUDR). Dibújalo en el mapa.`
    if (form.fechaVerificacionDeforestacion && form.fechaVerificacionDeforestacion > hoy()) er.fechaVerificacionDeforestacion = 'La fecha no puede ser futura.'
    return er
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const er = validar()
    setErrores(er)
    if (Object.keys(er).length) return
    setGuardando(true)
    const cuerpo = {
      nombreFinca: form.nombreFinca.trim(),
      areaHectareas: Number(area.toFixed(2)),
      latitud: redondear(lat),
      longitud: redondear(lng),
      poligonoGeojson: poligonoDesde(vertices),
      fechaVerificacionDeforestacion: form.fechaVerificacionDeforestacion || null,
    }
    try {
      const guardada = editando ? await productoresApi.editarFinca(finca.idFinca, cuerpo) : await productoresApi.crearFinca(idProductor, cuerpo)
      onGuardado(guardada, editando)
    } catch (err) {
      setErrorGeneral(err.message)
      if (err.campos) setErrores(err.campos)
    } finally {
      setGuardando(false)
    }
  }

  const error = (c) => errores[c] && <span className="campo__error">{errores[c]}</span>

  return (
    <Modal
      ancho
      titulo={editando ? 'Editar finca' : 'Nueva finca'}
      subtitulo="Ubicación y límites del predio para la trazabilidad EUDR"
      onCerrar={onCerrar}
      bloqueado={guardando}
      onSubmit={guardar}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton boton--primario" disabled={guardando}>
            {guardando ? <span className="spinner spinner--claro" /> : editando ? 'Guardar cambios' : 'Registrar finca'}
          </button>
        </>
      }
    >
      <div className="finca-form">
        <div className="finca-form__datos">
          <label className="campo">
            <span>Nombre de la finca</span>
            <input value={form.nombreFinca} onChange={cambiar('nombreFinca')} maxLength={120} autoFocus aria-invalid={!!errores.nombreFinca} />
            {error('nombreFinca')}
          </label>
          <label className="campo">
            <span>Área (hectáreas)</span>
            <input type="number" min="0.01" step="0.01" value={form.areaHectareas} onChange={cambiar('areaHectareas')} aria-invalid={!!errores.areaHectareas} />
            {error('areaHectareas')}
            {areaPoligono > 0 && (
              <span className="campo__nota">
                El polígono mide ≈ {areaPoligono.toFixed(2)} ha.{' '}
                <button type="button" className="enlace-boton" onClick={() => setForm((f) => ({ ...f, areaHectareas: areaPoligono.toFixed(2) }))}>Usar este valor</button>
              </span>
            )}
          </label>
          <div className="rejilla-campos">
            <label className="campo">
              <span>Latitud</span>
              <input type="number" step="0.000001" value={form.latitud} onChange={cambiar('latitud')} className="mono" aria-invalid={!!errores.latitud} />
              {error('latitud')}
            </label>
            <label className="campo">
              <span>Longitud</span>
              <input type="number" step="0.000001" value={form.longitud} onChange={cambiar('longitud')} className="mono" aria-invalid={!!errores.longitud} />
              {error('longitud')}
            </label>
          </div>
          <label className="campo">
            <span>Verificación de no deforestación <em className="texto-suave">(opcional)</em></span>
            <input type="date" max={hoy()} value={form.fechaVerificacionDeforestacion} onChange={cambiar('fechaVerificacionDeforestacion')} aria-invalid={!!errores.fechaVerificacionDeforestacion} />
            {error('fechaVerificacionDeforestacion')}
          </label>
          <div className={`aviso ${requierePoligono ? (vertices.length >= 3 ? 'aviso--exito' : 'aviso--alerta') : 'aviso--info'}`}>
            <Icono nombre={requierePoligono && vertices.length < 3 ? 'alerta' : 'pin'} tam={16} />
            <span>
              {requierePoligono
                ? vertices.length >= 3
                  ? `Polígono listo (${vertices.length} vértices). Cumple EUDR para fincas de más de ${LIMITE_HA_SIN_POLIGONO} ha.`
                  : `Más de ${LIMITE_HA_SIN_POLIGONO} ha: el polígono de límites es obligatorio (EUDR).`
                : `Hasta ${LIMITE_HA_SIN_POLIGONO} ha basta con el punto. El polígono es opcional.`}
            </span>
          </div>
        </div>

        <div className="finca-form__mapa">
          <div className="segmentado" role="tablist" aria-label="Qué marcar en el mapa">
            <button type="button" className={modo === 'punto' ? 'activo' : ''} onClick={() => setModo('punto')}>
              <Icono nombre="pin" tam={14} /> Ubicar punto
            </button>
            <button type="button" className={modo === 'poligono' ? 'activo' : ''} onClick={() => setModo('poligono')}>
              <Icono nombre="poligono" tam={14} /> Dibujar polígono
            </button>
          </div>
          <Mapa
            alto={330}
            onClic={alClicMapa}
            trazo={vertices}
            fincas={hayPunto ? [{ id: 'actual', punto: [lat, lng] }] : []}
            encuadrar={vertices.length ? vertices : hayPunto ? [[lat, lng]] : []}
          />
          <p className="campo__nota">
            {modo === 'punto' ? 'Haz clic en el mapa para ubicar la finca.' : 'Haz clic en cada esquina del predio, en orden.'}
          </p>
          {vertices.length > 0 && (
            <div className="acciones acciones--pequenas">
              <button type="button" className="boton boton--secundario" onClick={() => setVertices((v) => v.slice(0, -1))}>Deshacer punto</button>
              <button type="button" className="boton boton--secundario" onClick={() => setVertices([])}>Borrar polígono</button>
              {vertices.length >= 3 && <button type="button" className="boton boton--secundario" onClick={usarCentroDelPoligono}>Centrar punto</button>}
            </div>
          )}
          {error('poligonoGeojson')}
        </div>
      </div>
      {errorGeneral && <div className="aviso aviso--error" role="alert"><Icono nombre="alerta" tam={16} /> {errorGeneral}</div>}
    </Modal>
  )
}
