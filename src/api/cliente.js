import { respuestaDemo } from './demo.js'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')
export const MODO_DEMO = import.meta.env.VITE_MODO_DEMO === 'true'

const CLAVE_SESION = 'ritech.sesion'

export class ErrorApi extends Error {
  constructor(estado, mensaje, campos) {
    super(mensaje)
    this.estado = estado
    this.campos = campos || {}
  }
}

export function leerSesion() {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION))
    if (!sesion || Date.now() > sesion.expiraEn) return null
    return sesion
  } catch {
    return null
  }
}

export function guardarSesion(sesion) {
  try {
    if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
    else localStorage.removeItem(CLAVE_SESION)
  } catch {
    // El navegador puede bloquear el almacenamiento; la sesión sigue en memoria.
  }
}

let alExpirar = () => {}
export function registrarAlExpirar(fn) {
  alExpirar = fn
}

const MENSAJES_POR_ESTADO = {
  400: 'Revisa los datos enviados.',
  401: 'Tu sesión expiró. Inicia sesión de nuevo.',
  403: 'No tienes permiso para ver esta información.',
  404: 'No encontramos lo que buscas.',
  409: 'La operación entra en conflicto con datos existentes.',
  422: 'La operación no cumple una regla del negocio.',
  500: 'El servidor tuvo un problema. Intenta más tarde.',
}

export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  if (MODO_DEMO) return respuestaDemo(ruta, metodo, cuerpo)

  const sesion = leerSesion()
  const cabeceras = { Accept: 'application/json' }
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json'
  if (sesion?.token) cabeceras.Authorization = `Bearer ${sesion.token}`

  let respuesta
  const control = new AbortController()
  const limite = setTimeout(() => control.abort(), 120000)
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: control.signal,
    })
  } catch (e) {
    throw new ErrorApi(0, e.name === 'AbortError'
      ? 'El servidor tardó demasiado en responder. Intenta de nuevo en un momento.'
      : 'No hay conexión con el servidor. Verifica que el backend esté encendido.')
  } finally {
    clearTimeout(limite)
  }

  if (respuesta.status === 204) return null
  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    if (respuesta.status === 401 && sesion && !ruta.startsWith('/api/auth/login')) alExpirar()
    // El backend responde con RespuestaError { estado, error, mensaje, ruta, campos, fecha }
    const mensaje = datos?.mensaje || MENSAJES_POR_ESTADO[respuesta.status] || 'Ocurrió un error inesperado.'
    throw new ErrorApi(respuesta.status, mensaje, datos?.campos)
  }
  return datos
}

/** Despierta el backend (plan gratis de Render) sin esperar respuesta ni mostrar errores. */
export function despertarServidor() {
  if (MODO_DEMO) return
  fetch(`${API_URL}/salud`, { mode: 'no-cors' }).catch(() => {})
}

export const authApi = {
  login: (email, password) => api('/api/auth/login', { metodo: 'POST', cuerpo: { email, password } }),
  yo: () => api('/api/auth/yo'),
}

export const enviosApi = {
  listar: (estado) => api(`/api/envios${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`),
  detalle: (id) => api(`/api/envios/${id}`),
  registrarEvento: (id, evento) => api(`/api/envios/${id}/seguimiento`, { metodo: 'POST', cuerpo: evento }),
}

const consulta = (params) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  return q.toString() ? `?${q}` : ''
}

export const catalogosApi = {
  paises: (soloUe) => api(`/api/paises${soloUe ? '?ue=true' : ''}`),
}

export const clientesApi = {
  listar: (filtros = {}) => api(`/api/clientes${consulta(filtros)}`),
  crear: (cliente) => api('/api/clientes', { metodo: 'POST', cuerpo: cliente }),
  editar: (id, cliente) => api(`/api/clientes/${id}`, { metodo: 'PUT', cuerpo: cliente }),
}

export const productoresApi = {
  listar: () => api('/api/productores'),
  obtener: (id) => api(`/api/productores/${id}`),
  crear: (p) => api('/api/productores', { metodo: 'POST', cuerpo: p }),
  editar: (id, p) => api(`/api/productores/${id}`, { metodo: 'PUT', cuerpo: p }),
  fincas: (id) => api(`/api/productores/${id}/fincas`),
  crearFinca: (id, f) => api(`/api/productores/${id}/fincas`, { metodo: 'POST', cuerpo: f }),
  editarFinca: (idFinca, f) => api(`/api/fincas/${idFinca}`, { metodo: 'PUT', cuerpo: f }),
}

export const lotesApi = {
  productos: () => api('/api/productos'),
  listar: (filtros = {}) => api(`/api/lotes${consulta(filtros)}`),
  obtener: (id) => api(`/api/lotes/${id}`),
  inspecciones: (id) => api(`/api/lotes/${id}/inspecciones`),
  inspeccionar: (id, i) => api(`/api/lotes/${id}/inspecciones`, { metodo: 'POST', cuerpo: i }),
  trazabilidad: (id) => api(`/api/lotes/${id}/trazabilidad`),
  crear: (l) => api('/api/lotes', { metodo: 'POST', cuerpo: l }),
  editar: (id, l) => api(`/api/lotes/${id}`, { metodo: 'PUT', cuerpo: l }),
  aportes: (id) => api(`/api/lotes/${id}/fincas`),
  agregarAporte: (id, a) => api(`/api/lotes/${id}/fincas`, { metodo: 'POST', cuerpo: a }),
  editarAporte: (id, idFinca, a) => api(`/api/lotes/${id}/fincas/${idFinca}`, { metodo: 'PUT', cuerpo: a }),
  quitarAporte: (id, idFinca) => api(`/api/lotes/${id}/fincas/${idFinca}`, { metodo: 'DELETE' }),
  cerrarTrazabilidad: (id) => api(`/api/lotes/${id}/cerrar-trazabilidad`, { metodo: 'POST' }),
}

export const usuariosApi = {
  listar: () => api('/api/usuarios'),
  crear: (u) => api('/api/usuarios', { metodo: 'POST', cuerpo: u }),
  editar: (id, u) => api(`/api/usuarios/${id}`, { metodo: 'PUT', cuerpo: u }),
  cambiarEstado: (id, estado) => api(`/api/usuarios/${id}/estado`, { metodo: 'PATCH', cuerpo: { estado } }),
  roles: () => api('/api/roles'),
}

export const auditoriaApi = {
  listar: (filtros = {}) => api(`/api/auditoria${consulta(filtros)}`),
}

export const ordenesApi = {
  listar: (filtros = {}) => api(`/api/ordenes${consulta(filtros)}`),
  detalle: (id) => api(`/api/ordenes/${id}`),
  crear: (o) => api('/api/ordenes', { metodo: 'POST', cuerpo: o }),
  editar: (id, o) => api(`/api/ordenes/${id}`, { metodo: 'PUT', cuerpo: o }),
  cambiarEstado: (id, estado) => api(`/api/ordenes/${id}/estado`, { metodo: 'PATCH', cuerpo: { estado } }),
  asignarLote: (id, a) => api(`/api/ordenes/${id}/lotes`, { metodo: 'POST', cuerpo: a }),
  editarLote: (id, idLote, a) => api(`/api/ordenes/${id}/lotes/${idLote}`, { metodo: 'PUT', cuerpo: a }),
  quitarLote: (id, idLote) => api(`/api/ordenes/${id}/lotes/${idLote}`, { metodo: 'DELETE' }),
  programarEnvio: (id, e) => api(`/api/ordenes/${id}/envios`, { metodo: 'POST', cuerpo: e }),
}

export const transportistasApi = {
  listar: () => api('/api/transportistas'),
}

/** Petición con archivo (multipart) o que devuelve un archivo (blob). */
async function apiArchivo(ruta, { metodo = 'GET', archivo } = {}) {
  if (MODO_DEMO) return respuestaDemo(ruta, metodo, archivo ? { archivo } : undefined)
  const sesion = leerSesion()
  const cabeceras = sesion?.token ? { Authorization: `Bearer ${sesion.token}` } : {}
  let cuerpo
  if (archivo) {
    cuerpo = new FormData()
    cuerpo.append('archivo', archivo)
  }
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { method: metodo, headers: cabeceras, body: cuerpo })
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor. Verifica que el backend esté encendido.')
  }
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null)
    if (respuesta.status === 401 && sesion) alExpirar()
    throw new ErrorApi(respuesta.status, datos?.mensaje || MENSAJES_POR_ESTADO[respuesta.status] || 'No se pudo procesar el archivo.', datos?.campos)
  }
  return archivo ? respuesta.json() : respuesta.blob()
}

export const cumplimientoApi = {
  tiposCertificado: () => api('/api/certificaciones'),
  certificados: (idLote) => api(`/api/lotes/${idLote}/certificados`),
  cargarCertificado: (idLote, c) => api(`/api/lotes/${idLote}/certificados`, { metodo: 'POST', cuerpo: c }),
  subirSoporte: (idLote, idCert, archivo) => apiArchivo(`/api/lotes/${idLote}/certificados/${idCert}/soporte`, { metodo: 'POST', archivo }),
  descargarSoporte: (idLote, idCert) => apiArchivo(`/api/lotes/${idLote}/certificados/${idCert}/soporte`),
  porVencer: (dias) => api(`/api/certificados/por-vencer${consulta({ dias })}`),
  reglas: () => api('/api/reglas'),
  parametros: () => api('/api/reglas/parametros'),
  crearRegla: (r) => api('/api/reglas', { metodo: 'POST', cuerpo: r }),
  editarRegla: (id, r) => api(`/api/reglas/${id}`, { metodo: 'PUT', cuerpo: r }),
  activarRegla: (id, valor) => api(`/api/reglas/${id}/activa?valor=${valor}`, { metodo: 'PATCH' }),
  validar: (idLote) => api(`/api/lotes/${idLote}/validar`, { metodo: 'POST' }),
  dictamen: (idLote) => api(`/api/lotes/${idLote}/dictamen`),
}

export const productosApi = {
  listar: () => api('/api/productos'),
  crear: (p) => api('/api/productos', { metodo: 'POST', cuerpo: p }),
  editar: (id, p) => api(`/api/productos/${id}`, { metodo: 'PUT', cuerpo: p }),
  eliminar: (id) => api(`/api/productos/${id}`, { metodo: 'DELETE' }),
}

/** Descarga un archivo autenticado y devuelve { blob, nombre } (nombre según Content-Disposition). */
async function obtenerArchivo(ruta, nombrePorDefecto) {
  if (MODO_DEMO) return respuestaDemo(ruta, 'GET')
  const sesion = leerSesion()
  let respuesta
  const control = new AbortController()
  const limite = setTimeout(() => control.abort(), 120000)
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      headers: sesion?.token ? { Authorization: `Bearer ${sesion.token}` } : {},
      signal: control.signal,
    })
  } catch (e) {
    throw new ErrorApi(0, e.name === 'AbortError' ? 'El servidor tardó demasiado en generar el archivo.' : 'No hay conexión con el servidor. Verifica que el backend esté encendido.')
  } finally {
    clearTimeout(limite)
  }
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null)
    if (respuesta.status === 401 && sesion) alExpirar()
    throw new ErrorApi(respuesta.status, datos?.mensaje || MENSAJES_POR_ESTADO[respuesta.status] || 'No se pudo generar el archivo.', datos?.campos)
  }
  const cd = respuesta.headers.get('Content-Disposition') ?? ''
  const m = cd.match(/filename\*=UTF-8''([^;]+)/i) ?? cd.match(/filename="?([^";]+)"?/i)
  const nombre = m ? decodeURIComponent(m[1]) : nombrePorDefecto
  return { blob: await respuesta.blob(), nombre }
}

export const documentosApi = {
  factura: (idOrden) => obtenerArchivo(`/api/ordenes/${idOrden}/factura`, `factura-orden-${idOrden}.pdf`),
  listaEmpaque: (idOrden) => obtenerArchivo(`/api/ordenes/${idOrden}/lista-empaque`, `lista-empaque-orden-${idOrden}.pdf`),
  dds: (idLote) => obtenerArchivo(`/api/lotes/${idLote}/dds`, `dds-lote-${idLote}.pdf`),
  ddsGeojson: (idLote) => obtenerArchivo(`/api/lotes/${idLote}/dds/geojson`, `dds-lote-${idLote}.geojson`),
}

export const reportesApi = {
  tablero: () => api('/api/reportes/tablero'),
  exportar: (reporte, { formato = 'xlsx', desde, hasta } = {}) =>
    obtenerArchivo(`/api/reportes/${reporte}${consulta({ formato, desde, hasta })}`, `${reporte}.${formato}`),
}
