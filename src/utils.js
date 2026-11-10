export const ESTADOS_ENVIO = {
  PROGRAMADO: { etiqueta: 'Programado', tono: 'neutro' },
  EN_PUERTO: { etiqueta: 'En puerto', tono: 'info' },
  EN_TRANSITO: { etiqueta: 'En tránsito', tono: 'primario' },
  ARRIBADO: { etiqueta: 'Arribado', tono: 'info' },
  ENTREGADO: { etiqueta: 'Entregado', tono: 'exito' },
  INCIDENCIA: { etiqueta: 'Incidencia', tono: 'alerta' },
}

// Orden normal de un envío. INCIDENCIA no es un paso: se marca sobre el último paso alcanzado.
export const PASOS_ENVIO = ['PROGRAMADO', 'EN_PUERTO', 'EN_TRANSITO', 'ARRIBADO', 'ENTREGADO']

const aFecha = (valor) => {
  if (!valor) return null
  // LocalDate "2026-11-10" se interpreta en hora local para no correr un día.
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T00:00:00`) : new Date(valor)
}

export function formatoFecha(valor) {
  const d = aFecha(valor)
  return d ? d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

export function formatoFechaHora(valor) {
  const d = aFecha(valor)
  return d
    ? d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'
}

export function diasHasta(valor) {
  const d = aFecha(valor)
  if (!d) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d - hoy) / 86400000)
}

/** Texto y tono del arribo estimado según el estado del envío. */
export function resumenArribo(envio) {
  if (envio.estadoEnvio === 'ENTREGADO') return { texto: 'Entregado', tono: 'exito' }
  if (envio.estadoEnvio === 'ARRIBADO') return { texto: 'Ya arribó a destino', tono: 'info' }
  const n = diasHasta(envio.fechaEstimadaArribo)
  if (n === null) return { texto: 'Arribo sin fecha estimada', tono: 'neutro' }
  if (n > 1) return { texto: `Llega en ${n} días`, tono: 'neutro' }
  if (n === 1) return { texto: 'Llega mañana', tono: 'neutro' }
  if (n === 0) return { texto: 'Llega hoy', tono: 'info' }
  return { texto: `Retrasado ${-n} ${n === -1 ? 'día' : 'días'}`, tono: 'alerta' }
}

/** Avance aproximado (0 a 1) entre zarpe y arribo, para la barra de ruta. */
export function avanceRuta(envio) {
  const i = PASOS_ENVIO.indexOf(envio.estadoEnvio)
  if (i >= 3) return 1
  if (i >= 0 && i < 2) return i * 0.06
  const zarpe = aFecha(envio.fechaEstimadaZarpe)
  const arribo = aFecha(envio.fechaEstimadaArribo)
  if (!zarpe || !arribo || arribo <= zarpe) return 0.5
  const t = (Date.now() - zarpe) / (arribo - zarpe)
  return Math.min(0.95, Math.max(0.12, t))
}
