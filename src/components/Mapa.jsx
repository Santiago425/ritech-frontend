import 'leaflet/dist/leaflet.css'
import { Fragment, useEffect } from 'react'
import { CircleMarker, MapContainer, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'

const CENTRO_COLOMBIA = [2.45, -76.6]
const COLOR = '#c8893b'
const COLOR_SEL = '#1f6feb'

function Encuadre({ puntos }) {
  const map = useMap()
  const clave = JSON.stringify(puntos)
  useEffect(() => {
    if (!puntos.length) return
    if (puntos.length === 1) map.setView(puntos[0], Math.max(map.getZoom(), 14))
    else map.fitBounds(puntos, { padding: [30, 30], maxZoom: 16 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return null
}

function Clics({ onClic }) {
  useMapEvents({ click: (e) => onClic?.([e.latlng.lat, e.latlng.lng]) })
  return null
}

/**
 * Mapa con fincas. Cada finca: { id, nombre, punto: [lat,lng], vertices: [[lat,lng]...] }.
 * Modo edición: onClic recibe [lat, lng] y `trazo` muestra el polígono en construcción.
 */
export default function Mapa({ fincas = [], seleccionada, onSeleccionar, onClic, trazo, alto = 320, encuadrar }) {
  const puntos = encuadrar ?? fincas.flatMap((f) => (f.vertices?.length ? f.vertices : f.punto ? [f.punto] : []))

  return (
    <div className={`mapa ${onClic ? 'mapa--edicion' : ''}`} style={{ height: alto }}>
      <MapContainer center={puntos[0] ?? CENTRO_COLOMBIA} zoom={puntos.length ? 13 : 7} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Encuadre puntos={puntos} />
        {onClic && <Clics onClic={onClic} />}
        {fincas.map((f) => {
          const sel = f.id === seleccionada
          const color = sel ? COLOR_SEL : COLOR
          return (
            <Fragment key={f.id}>
              {f.vertices?.length >= 3 && (
                <Polygon positions={f.vertices} pathOptions={{ color, weight: 2, fillOpacity: sel ? 0.3 : 0.18 }} eventHandlers={{ click: () => onSeleccionar?.(f.id) }} />
              )}
              {f.punto && (
                <CircleMarker center={f.punto} radius={sel ? 9 : 7} pathOptions={{ color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }} eventHandlers={{ click: () => onSeleccionar?.(f.id) }}>
                  {f.nombre && <Tooltip direction="top" offset={[0, -8]}>{f.nombre}</Tooltip>}
                </CircleMarker>
              )}
            </Fragment>
          )
        })}
        {trazo?.length > 0 && (
          <>
            {trazo.length >= 3 ? (
              <Polygon positions={trazo} pathOptions={{ color: COLOR_SEL, weight: 2, dashArray: '6 4', fillOpacity: 0.15 }} />
            ) : (
              <Polyline positions={trazo} pathOptions={{ color: COLOR_SEL, weight: 2, dashArray: '6 4' }} />
            )}
            {trazo.map((v, i) => (
              <CircleMarker key={i} center={v} radius={4} pathOptions={{ color: COLOR_SEL, fillColor: '#fff', fillOpacity: 1, weight: 2 }} />
            ))}
          </>
        )}
      </MapContainer>
    </div>
  )
}
