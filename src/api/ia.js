const IA_URL = (import.meta.env.VITE_IA_URL || '').replace(/\/$/, '')
export const IA_DISPONIBLE = Boolean(IA_URL)

async function pedir(ruta, cuerpo) {
  const control = new AbortController()
  const limite = setTimeout(() => control.abort(), 60000)
  let respuesta
  try {
    respuesta = await fetch(`${IA_URL}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: control.signal,
    })
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'La IA tardó demasiado en responder. Intenta de nuevo.' : 'No hay conexión con el servicio de IA. Puede estar despertando, intenta en unos segundos.')
  } finally {
    clearTimeout(limite)
  }
  if (!respuesta.ok) throw new Error('El servicio de IA no pudo procesar la solicitud.')
  return respuesta.json()
}

export function despertarIa() {
  if (IA_DISPONIBLE) fetch(`${IA_URL}/health`, { mode: 'no-cors' }).catch(() => {})
}

const hoyIso = () => new Date().toISOString().slice(0, 10)

export const iaApi = {
  resumenTablero: (tablero, rol) => pedir('/api/v1/dashboard-summary', { ...tablero, date: hoyIso(), role: rol }),
  analizarLote: (lote, producto, dictamen) => pedir('/api/v1/lot-analysis', {
    codigoLote: lote.codigoLote,
    producto: producto ?? '',
    estadoLote: lote.estadoLote,
    pesoNetoKg: lote.pesoNetoKg,
    dictamen: dictamen.dictamen,
    reglasEvaluadas: dictamen.reglasEvaluadas ?? 0,
    reglasIncumplidas: dictamen.reglasIncumplidas ?? 0,
    detalle: (dictamen.detalle ?? []).map((r) => ({
      ...r,
      valorEvaluado: r.valorEvaluado == null ? null : String(r.valorEvaluado),
      valorLimite: r.valorLimite == null ? null : String(r.valorLimite),
    })),
  }),
  redactarEvento: (texto, envio) => pedir('/api/v1/shipment-event', {
    text: texto,
    currentState: envio.estadoEnvio,
    origin: envio.puertoOrigen ?? '',
    destination: envio.puertoDestino ?? '',
  }),
  preguntar: (pregunta, { rol, pagina, historial }) => pedir('/api/v1/chat', { question: pregunta, role: rol, page: pagina, history: historial }),
}
