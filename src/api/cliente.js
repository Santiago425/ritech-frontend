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
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor. Verifica que el backend esté encendido.')
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

export const authApi = {
  login: (email, password) => api('/api/auth/login', { metodo: 'POST', cuerpo: { email, password } }),
  yo: () => api('/api/auth/yo'),
}

export const enviosApi = {
  listar: (estado) => api(`/api/envios${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`),
  detalle: (id) => api(`/api/envios/${id}`),
  registrarEvento: (id, evento) => api(`/api/envios/${id}/seguimiento`, { metodo: 'POST', cuerpo: evento }),
}
