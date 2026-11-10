// Datos de ejemplo para presentar la interfaz sin el backend (VITE_MODO_DEMO=true).
// Reproducen la forma exacta de las respuestas de la API.

const hoy = new Date()
const dias = (n) => {
  const d = new Date(hoy)
  d.setDate(d.getDate() + n)
  return d
}
const fecha = (n) => dias(n).toISOString().slice(0, 10)
const fechaHora = (n, h = 9) => {
  const d = dias(n)
  d.setHours(h, 0, 0, 0)
  return d.toISOString().slice(0, 19)
}

const PERMISOS = {
  ADMINISTRADOR: ['AUDITORIA_CONSULTAR', 'CLIENTES_GESTIONAR', 'LOTES_CONSULTAR', 'ORDENES_GESTIONAR', 'USUARIOS_GESTIONAR'],
  GESTOR_EXPORTACIONES: ['CLIENTES_GESTIONAR', 'LOTES_CONSULTAR', 'LOTES_CREAR', 'ORDENES_GESTIONAR'],
  INSPECTOR_CALIDAD: ['CERTIFICADOS_CARGAR', 'INSPECCION_REGISTRAR', 'LOTES_CONSULTAR'],
  CLIENTE_UE: ['LOTES_CONSULTAR'],
}

const USUARIOS = {
  'admin@ritech.co': { idUsuario: 1, nombreCompleto: 'Felipe Ceron', rol: 'ADMINISTRADOR' },
  'gestor@ritech.co': { idUsuario: 2, nombreCompleto: 'Manuel Alejandro Villarreal', rol: 'GESTOR_EXPORTACIONES' },
  'inspector@ritech.co': { idUsuario: 3, nombreCompleto: 'Camilo Bolaños', rol: 'INSPECTOR_CALIDAD' },
  'cliente@importadora-eu.com': { idUsuario: 4, nombreCompleto: 'Kaffeehaus Import GmbH', rol: 'CLIENTE_UE', idCliente: 1 },
}

const ENVIOS = [
  {
    envio: { idEnvio: 1, idOrden: 1, idTransportista: 1, numeroContenedor: 'MSKU1234567', bookingBl: 'BK-2026-55012',
      puertoOrigen: 'Buenaventura', puertoDestino: 'Hamburgo', fechaEstimadaZarpe: fecha(-20), fechaEstimadaArribo: fecha(6), estadoEnvio: 'EN_TRANSITO' },
    transportista: 'Maersk Line', numeroOrden: 'OE-2026-0001',
    seguimiento: [
      { idSeguimiento: 1, fechaEvento: fechaHora(-24, 8), ubicacion: 'Bodega Popayán', estado: 'PROGRAMADO', observacion: 'Lote consolidado y precintado' },
      { idSeguimiento: 2, fechaEvento: fechaHora(-22, 14), ubicacion: 'Puerto de Buenaventura', estado: 'EN_PUERTO', observacion: 'Contenedor en patio, pendiente de embarque' },
      { idSeguimiento: 3, fechaEvento: fechaHora(-19, 6), ubicacion: 'Canal de Panamá', estado: 'EN_TRANSITO', observacion: 'Buque Maersk Sentosa en tránsito' },
      { idSeguimiento: 4, fechaEvento: fechaHora(-4, 11), ubicacion: 'Océano Atlántico, frente a Azores', estado: 'EN_TRANSITO', observacion: 'Navegación sin novedad' },
    ],
  },
  {
    envio: { idEnvio: 2, idOrden: 2, idTransportista: 2, numeroContenedor: 'HLXU7654321', bookingBl: 'BK-2026-55190',
      puertoOrigen: 'Cartagena', puertoDestino: 'Róterdam', fechaEstimadaZarpe: fecha(-30), fechaEstimadaArribo: fecha(-3), estadoEnvio: 'INCIDENCIA' },
    transportista: 'Hapag-Lloyd', numeroOrden: 'OE-2026-0002',
    seguimiento: [
      { idSeguimiento: 5, fechaEvento: fechaHora(-33), ubicacion: 'Bodega Pitalito', estado: 'PROGRAMADO', observacion: 'Envío programado' },
      { idSeguimiento: 6, fechaEvento: fechaHora(-31), ubicacion: 'Puerto de Cartagena', estado: 'EN_PUERTO', observacion: null },
      { idSeguimiento: 7, fechaEvento: fechaHora(-29), ubicacion: 'Mar Caribe', estado: 'EN_TRANSITO', observacion: null },
      { idSeguimiento: 8, fechaEvento: fechaHora(-2, 16), ubicacion: 'Puerto de Róterdam', estado: 'INCIDENCIA', observacion: 'Inspección aduanera adicional EUDR; se estima liberación en 48 horas' },
    ],
  },
  {
    envio: { idEnvio: 3, idOrden: 3, idTransportista: 1, numeroContenedor: 'MSKU9988776', bookingBl: 'BK-2026-54870',
      puertoOrigen: 'Buenaventura', puertoDestino: 'Amberes', fechaEstimadaZarpe: fecha(-50), fechaEstimadaArribo: fecha(-21), estadoEnvio: 'ENTREGADO' },
    transportista: 'Maersk Line', numeroOrden: 'OE-2025-0047',
    seguimiento: [
      { idSeguimiento: 9, fechaEvento: fechaHora(-53), ubicacion: 'Bodega Popayán', estado: 'PROGRAMADO', observacion: 'Envío programado' },
      { idSeguimiento: 10, fechaEvento: fechaHora(-51), ubicacion: 'Puerto de Buenaventura', estado: 'EN_PUERTO', observacion: null },
      { idSeguimiento: 11, fechaEvento: fechaHora(-49), ubicacion: 'Océano Pacífico', estado: 'EN_TRANSITO', observacion: null },
      { idSeguimiento: 12, fechaEvento: fechaHora(-22), ubicacion: 'Puerto de Amberes', estado: 'ARRIBADO', observacion: 'Descarga completa' },
      { idSeguimiento: 13, fechaEvento: fechaHora(-19), ubicacion: 'Bodega del importador, Bruselas', estado: 'ENTREGADO', observacion: 'Recibido a satisfacción' },
    ],
  },
  {
    envio: { idEnvio: 4, idOrden: 4, idTransportista: 3, numeroContenedor: null, bookingBl: 'BK-2026-55301',
      puertoOrigen: 'Santa Marta', puertoDestino: 'Valencia', fechaEstimadaZarpe: fecha(5), fechaEstimadaArribo: fecha(27), estadoEnvio: 'PROGRAMADO' },
    transportista: 'CMA CGM', numeroOrden: 'OE-2026-0004',
    seguimiento: [
      { idSeguimiento: 14, fechaEvento: fechaHora(-1), ubicacion: 'Santa Marta', estado: 'PROGRAMADO', observacion: 'Envío programado' },
    ],
  },
]

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

export async function respuestaDemo(ruta, metodo, cuerpo) {
  await esperar(350)
  const [camino, consulta] = ruta.split('?')

  if (camino === '/api/auth/login' && metodo === 'POST') {
    const base = USUARIOS[cuerpo?.email?.trim().toLowerCase()]
    if (!base || !cuerpo?.password) {
      const e = new Error('Correo o contrasena incorrectos.')
      e.estado = 401
      throw Object.assign(e, { campos: {} })
    }
    const usuario = { ...base, email: cuerpo.email.trim().toLowerCase(), permisos: PERMISOS[base.rol] }
    return { token: 'demo', tipo: 'Bearer', expiraEnSegundos: 8 * 3600, usuario }
  }

  if (camino === '/api/envios') {
    const estado = new URLSearchParams(consulta).get('estado')
    return ENVIOS.map((e) => e.envio).filter((e) => !estado || e.estadoEnvio === estado)
  }

  const detalle = camino.match(/^\/api\/envios\/(\d+)$/)
  if (detalle) {
    const encontrado = ENVIOS.find((e) => e.envio.idEnvio === Number(detalle[1]))
    if (!encontrado) throw Object.assign(new Error('El envio no existe.'), { estado: 404, campos: {} })
    return encontrado
  }

  throw Object.assign(new Error('Esta opción no está disponible en el modo demo.'), { estado: 404, campos: {} })
}
