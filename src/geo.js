// Utilidades de geolocalización de fincas (EUDR).

export const LIMITE_HA_SIN_POLIGONO = 4

/** El backend guarda el polígono como texto JSON; aquí se normaliza a objeto. */
export function leerPoligono(valor) {
  if (!valor) return null
  if (typeof valor === 'object') return valor
  try {
    return JSON.parse(valor)
  } catch {
    return null
  }
}

/** Vértices [lat, lng] del anillo exterior de un Polygon GeoJSON, sin el punto de cierre. */
export function verticesDe(geojson) {
  const anillo = geojson?.type === 'Polygon' ? geojson.coordinates?.[0] : null
  if (!Array.isArray(anillo)) return []
  const puntos = anillo.map(([lng, lat]) => [lat, lng])
  const [a, b] = [puntos[0], puntos[puntos.length - 1]]
  if (puntos.length > 1 && a[0] === b[0] && a[1] === b[1]) puntos.pop()
  return puntos
}

/** Polygon GeoJSON cerrado a partir de vértices [lat, lng]. */
export function poligonoDesde(vertices) {
  if (vertices.length < 3) return null
  const anillo = vertices.map(([lat, lng]) => [redondear(lng), redondear(lat)])
  anillo.push(anillo[0])
  return { type: 'Polygon', coordinates: [anillo] }
}

/** Área aproximada en hectáreas (proyección local; suficiente para fincas). */
export function areaHectareas(vertices) {
  if (vertices.length < 3) return 0
  const lat0 = (vertices.reduce((s, [lat]) => s + lat, 0) / vertices.length) * (Math.PI / 180)
  const xy = vertices.map(([lat, lng]) => [lng * 111320 * Math.cos(lat0), lat * 110540])
  let doble = 0
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i]
    const [x2, y2] = xy[(i + 1) % xy.length]
    doble += x1 * y2 - x2 * y1
  }
  return Math.abs(doble) / 2 / 10000
}

export function centroDe(vertices) {
  if (!vertices.length) return null
  return [
    vertices.reduce((s, [lat]) => s + lat, 0) / vertices.length,
    vertices.reduce((s, [, lng]) => s + lng, 0) / vertices.length,
  ]
}

export const redondear = (n) => Math.round(n * 1e6) / 1e6

export const formatoCoord = (lat, lng) =>
  lat == null || lng == null ? '—' : `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
