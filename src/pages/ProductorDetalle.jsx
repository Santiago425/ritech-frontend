import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { productoresApi } from '../api/cliente.js'
import { useSesion } from '../auth/SesionContext.jsx'
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.jsx'
import FincaForm from '../components/FincaForm.jsx'
import Icono from '../components/Icono.jsx'
import Mapa from '../components/Mapa.jsx'
import ProductorForm from '../components/ProductorForm.jsx'
import { useCarga } from '../hooks.js'
import { formatoFecha } from '../utils.js'
import { LIMITE_HA_SIN_POLIGONO, formatoCoord, leerPoligono, verticesDe } from '../geo.js'

function estadoEudr(f) {
  const tienePoligono = verticesDe(leerPoligono(f.poligonoGeojson)).length >= 3
  if (Number(f.areaHectareas) > LIMITE_HA_SIN_POLIGONO && !tienePoligono) return { texto: 'Falta polígono', tono: 'alerta' }
  if (!f.fechaVerificacionDeforestacion) return { texto: 'Sin verificación', tono: 'neutro' }
  return { texto: 'Cumple EUDR', tono: 'exito' }
}

export default function ProductorDetalle() {
  const { id } = useParams()
  const location = useLocation()
  const { tienePermiso } = useSesion()
  const puedeGestionar = tienePermiso('PRODUCTORES_GESTIONAR')
  const productor = useCarga(() => productoresApi.obtener(id), [id])
  const fincas = useCarga(() => productoresApi.fincas(id), [id])
  const [seleccionada, setSeleccionada] = useState(null)
  const [editarProductor, setEditarProductor] = useState(false)
  const [formFinca, setFormFinca] = useState(null) // null | 'nueva' | finca
  const [aviso, setAviso] = useState(location.state?.creado ? 'Productor registrado. Ahora agrega sus fincas.' : '')

  const avisar = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(''), 4000)
  }

  const enMapa = useMemo(
    () => (fincas.datos ?? []).map((f) => ({
      id: f.idFinca,
      nombre: f.nombreFinca,
      punto: [Number(f.latitud), Number(f.longitud)],
      vertices: verticesDe(leerPoligono(f.poligonoGeojson)),
    })),
    [fincas.datos],
  )

  if (productor.cargando) return <div className="pagina"><Cargando texto="Cargando productor…" /></div>
  if (productor.error) {
    return (
      <div className="pagina">
        <Link to="/productores" className="volver"><Icono nombre="flecha" tam={16} /> Volver a productores</Link>
        <ErrorCaja error={productor.error} onReintentar={productor.error.estado === 404 ? null : productor.recargar} />
      </div>
    )
  }

  const p = productor.datos
  const lista = fincas.datos ?? []
  const totalHa = lista.reduce((s, f) => s + Number(f.areaHectareas), 0)

  return (
    <div className="pagina">
      <Link to="/productores" className="volver"><Icono nombre="flecha" tam={16} /> Volver a productores</Link>

      <header className="pagina__cabecera">
        <div>
          <span className="pagina__antetitulo">Productor · <span className="mono">{p.nitOCedula}</span></span>
          <h1>{p.nombre}</h1>
          <p className="texto-suave">
            <Icono nombre="pin" tam={14} /> {p.municipio}, {p.departamento}{p.telefono && <> · Tel. {p.telefono}</>}
          </p>
        </div>
        {puedeGestionar && (
          <div className="acciones">
            <button className="boton boton--secundario" onClick={() => setEditarProductor(true)}>Editar productor</button>
            <button className="boton boton--primario" onClick={() => setFormFinca('nueva')}>+ Nueva finca</button>
          </div>
        )}
      </header>

      {aviso && <div className="aviso aviso--exito" role="status"><Icono nombre="check" tam={16} /> {aviso}</div>}

      <div className="indicadores indicadores--3">
        <div className="indicador indicador--neutro"><span className="indicador__icono"><Icono nombre="hoja" tam={20} /></span><div><span className="indicador__titulo">Fincas</span><strong className="indicador__valor">{lista.length}</strong></div></div>
        <div className="indicador indicador--primario"><span className="indicador__icono"><Icono nombre="poligono" tam={20} /></span><div><span className="indicador__titulo">Área total</span><strong className="indicador__valor">{totalHa.toFixed(1)} ha</strong></div></div>
        <div className="indicador indicador--exito"><span className="indicador__icono"><Icono nombre="check" tam={20} /></span><div><span className="indicador__titulo">Cumplen EUDR</span><strong className="indicador__valor">{lista.filter((f) => estadoEudr(f).tono === 'exito').length} / {lista.length}</strong></div></div>
      </div>

      <section className="tarjeta">
        <div className="tarjeta__cabecera">
          <div>
            <h2>Fincas</h2>
            <p className="texto-suave">Toca una finca en el mapa o en la lista para resaltarla.</p>
          </div>
        </div>
        {fincas.cargando ? (
          <Cargando texto="Cargando fincas…" />
        ) : fincas.error ? (
          <ErrorCaja error={fincas.error} onReintentar={fincas.recargar} />
        ) : lista.length === 0 ? (
          <Vacio icono="hoja" titulo="Sin fincas registradas" texto={puedeGestionar ? 'Agrega la primera con "Nueva finca".' : null} />
        ) : (
          <div className="fincas">
            <Mapa fincas={enMapa} seleccionada={seleccionada} onSeleccionar={setSeleccionada} alto={420} />
            <ul className="fincas__lista">
              {lista.map((f) => {
                const eudr = estadoEudr(f)
                const poligono = verticesDe(leerPoligono(f.poligonoGeojson)).length >= 3
                return (
                  <li key={f.idFinca} className={`finca ${seleccionada === f.idFinca ? 'finca--sel' : ''}`} onClick={() => setSeleccionada(f.idFinca)}>
                    <div className="finca__cabecera">
                      <strong>{f.nombreFinca}</strong>
                      <span className={`badge badge--${eudr.tono}`}>{eudr.texto}</span>
                    </div>
                    <dl className="finca__datos">
                      <div><dt>Área</dt><dd>{Number(f.areaHectareas).toFixed(2)} ha</dd></div>
                      <div><dt>Coordenadas</dt><dd className="mono">{formatoCoord(f.latitud, f.longitud)}</dd></div>
                      <div><dt>Polígono</dt><dd>{poligono ? 'Sí' : 'No'}</dd></div>
                      <div><dt>Verificación</dt><dd>{formatoFecha(f.fechaVerificacionDeforestacion)}</dd></div>
                    </dl>
                    {puedeGestionar && (
                      <button className="boton boton--fantasma" onClick={(e) => { e.stopPropagation(); setFormFinca(f) }}>Editar finca</button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      {editarProductor && (
        <ProductorForm
          productor={p}
          onCerrar={() => setEditarProductor(false)}
          onGuardado={() => { setEditarProductor(false); productor.recargar(); avisar('Datos del productor actualizados.') }}
        />
      )}
      {formFinca && (
        <FincaForm
          idProductor={p.idProductor}
          finca={formFinca === 'nueva' ? null : formFinca}
          onCerrar={() => setFormFinca(null)}
          onGuardado={(f, editada) => {
            setFormFinca(null)
            fincas.recargar()
            setSeleccionada(f.idFinca)
            avisar(editada ? `Se actualizó la finca ${f.nombreFinca}.` : `Finca ${f.nombreFinca} registrada.`)
          }}
        />
      )}
    </div>
  )
}
