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

const CATALOGO_PERMISOS = [
  ['USUARIOS_GESTIONAR', 'SEGURIDAD', 'Crear, editar e inactivar usuarios y asignar roles'],
  ['AUDITORIA_CONSULTAR', 'SEGURIDAD', 'Consultar el rastro de auditoria del sistema'],
  ['REGLAS_ADMINISTRAR', 'NORMATIVA', 'Crear, editar, activar y desactivar reglas normativas UE'],
  ['CLIENTES_GESTIONAR', 'COMERCIAL', 'Crear y editar clientes importadores de la UE'],
  ['CLIENTES_CONSULTAR', 'COMERCIAL', 'Consultar y filtrar el listado de clientes'],
  ['PRODUCTOS_GESTIONAR', 'MAESTROS', 'Administrar el catalogo de productos y codigos HS'],
  ['PRODUCTORES_GESTIONAR', 'MAESTROS', 'Registrar productores y fincas con geolocalizacion'],
  ['LOTES_CREAR', 'LOTES', 'Registrar lotes de exportacion'],
  ['LOTES_TRAZABILIDAD', 'LOTES', 'Asociar fincas de origen y cerrar la trazabilidad'],
  ['LOTES_CONSULTAR', 'LOTES', 'Consultar lotes y su trazabilidad'],
  ['INSPECCION_REGISTRAR', 'CALIDAD', 'Registrar inspecciones y emitir dictamen'],
  ['CERTIFICADOS_CARGAR', 'CALIDAD', 'Cargar certificaciones del lote con su vigencia'],
  ['VALIDACION_EJECUTAR', 'NORMATIVA', 'Ejecutar el motor de validacion normativa sobre un lote'],
  ['ORDENES_GESTIONAR', 'COMERCIAL', 'Crear ordenes de exportacion y asignar lotes aprobados'],
].map(([codigo, modulo, descripcion], i) => ({ idPermiso: i + 1, codigo, modulo, descripcion }))

// Misma asignación que el script de la base de datos (roles_permisos).
const PERMISOS = {
  ADMINISTRADOR: CATALOGO_PERMISOS.map((p) => p.codigo),
  GESTOR_EXPORTACIONES: ['CLIENTES_GESTIONAR', 'CLIENTES_CONSULTAR', 'PRODUCTOS_GESTIONAR', 'PRODUCTORES_GESTIONAR', 'LOTES_CREAR', 'LOTES_TRAZABILIDAD', 'LOTES_CONSULTAR', 'VALIDACION_EJECUTAR', 'ORDENES_GESTIONAR'],
  INSPECTOR_CALIDAD: ['LOTES_CONSULTAR', 'INSPECCION_REGISTRAR', 'CERTIFICADOS_CARGAR'],
  CLIENTE_UE: ['LOTES_CONSULTAR'],
}

const ROLES = [
  ['ADMINISTRADOR', 'Administra usuarios, roles, permisos y reglas normativas; consulta auditoria'],
  ['GESTOR_EXPORTACIONES', 'Registra clientes, productores, fincas, lotes y ordenes de exportacion'],
  ['INSPECTOR_CALIDAD', 'Registra inspecciones, emite dictamenes y carga certificaciones'],
  ['CLIENTE_UE', 'Importador europeo con acceso de consulta a sus propias ordenes'],
].map(([nombreRol, descripcion], i) => ({
  idRol: i + 1,
  nombreRol,
  descripcion,
  permisos: CATALOGO_PERMISOS.filter((p) => PERMISOS[nombreRol].includes(p.codigo)),
}))

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
    transportista: 'Maersk Line', numeroOrden: 'ORD-2026-0001',
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
    transportista: 'Hapag-Lloyd', numeroOrden: 'ORD-2026-0002',
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
    transportista: 'Maersk Line', numeroOrden: 'ORD-2026-0003',
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
    transportista: 'CMA CGM', numeroOrden: 'ORD-2026-0004',
    seguimiento: [
      { idSeguimiento: 14, fechaEvento: fechaHora(-1), ubicacion: 'Santa Marta', estado: 'PROGRAMADO', observacion: 'Envío programado' },
    ],
  },
]

const PAISES = [
  ['AT', 'Austria'], ['BE', 'Belgica'], ['BG', 'Bulgaria'], ['HR', 'Croacia'], ['CY', 'Chipre'], ['CZ', 'Chequia'],
  ['DK', 'Dinamarca'], ['EE', 'Estonia'], ['FI', 'Finlandia'], ['FR', 'Francia'], ['DE', 'Alemania'], ['GR', 'Grecia'],
  ['HU', 'Hungria'], ['IE', 'Irlanda'], ['IT', 'Italia'], ['LV', 'Letonia'], ['LT', 'Lituania'], ['LU', 'Luxemburgo'],
  ['MT', 'Malta'], ['NL', 'Paises Bajos'], ['PL', 'Polonia'], ['PT', 'Portugal'], ['RO', 'Rumania'], ['SK', 'Eslovaquia'],
  ['SI', 'Eslovenia'], ['ES', 'Espana'], ['SE', 'Suecia'], ['CO', 'Colombia'],
].map(([codigoIso2, nombre], i) => ({ idPais: i + 1, codigoIso2, nombre, perteneceUe: codigoIso2 !== 'CO' }))
const idPais = (iso) => PAISES.find((p) => p.codigoIso2 === iso).idPais

const CLIENTES = [
  ['Kaffeehaus Import GmbH', 'DE123456789012', 'DE811234567', 'DE', 'Hamburgo', 'Speicherstadt 12', 'compras@kaffeehaus.de', 'ACTIVO'],
  ['Importadora Europea SL', 'ES987654321098', 'ESB12345678', 'ES', 'Valencia', 'Av. del Puerto 45', 'pedidos@importadora-eu.com', 'ACTIVO'],
  ['Cacao Benelux BV', 'NL445566778899', 'NL001234567B01', 'NL', 'Róterdam', 'Waalhaven 7', 'inkoop@cacaobenelux.nl', 'ACTIVO'],
  ['Torréfaction Lyonnaise SAS', 'FR112233445566', 'FR40123456789', 'FR', 'Lyon', '18 Rue Garibaldi', 'achats@torrefaction-lyon.fr', 'INACTIVO'],
  ['Caffè Adriatico SRL', 'IT998877665544', 'IT01234567890', 'IT', 'Trieste', 'Molo VII 3', 'acquisti@caffeadriatico.it', 'ACTIVO'],
  ['Nordic Beans AB', 'SE556677889900', 'SE556677889901', 'SE', 'Gotemburgo', 'Hamngatan 21', 'order@nordicbeans.se', 'ACTIVO'],
].map(([razonSocial, numeroEori, nitVat, iso, ciudad, direccion, emailContacto, estado], i) => ({
  idCliente: i + 1, razonSocial, numeroEori, nitVat, idPais: idPais(iso), ciudad, direccion, emailContacto, estado,
  creadoEn: fechaHora(-120 + i * 15),
}))

const PRODUCTORES = [
  { idProductor: 1, nitOCedula: '10612345', nombre: 'Asociación de Caficultores del Cauca', municipio: 'Popayán', departamento: 'Cauca', telefono: '3104567890' },
  { idProductor: 2, nitOCedula: '900456789-1', nombre: 'Cooperativa Cacaotera del Huila', municipio: 'Pitalito', departamento: 'Huila', telefono: '3157778899' },
  { idProductor: 3, nitOCedula: '76321456', nombre: 'Rosa Elena Muñoz', municipio: 'Timbío', departamento: 'Cauca', telefono: null },
]

const cuadrado = (lat, lng, d) => JSON.stringify({
  type: 'Polygon',
  coordinates: [[[lng - d, lat - d], [lng + d, lat - d], [lng + d, lat + d], [lng - d, lat + d], [lng - d, lat - d]]],
})

const FINCAS = [
  { idFinca: 1, idProductor: 1, nombreFinca: 'La Esperanza', areaHectareas: 3.5, latitud: 2.444814, longitud: -76.614739, poligonoGeojson: null, fechaVerificacionDeforestacion: fecha(-90) },
  { idFinca: 2, idProductor: 1, nombreFinca: 'El Mirador', areaHectareas: 12.8, latitud: 2.470120, longitud: -76.585300, poligonoGeojson: cuadrado(2.470120, -76.585300, 0.0016), fechaVerificacionDeforestacion: fecha(-60) },
  { idFinca: 3, idProductor: 2, nombreFinca: 'Villa Cacao', areaHectareas: 7.2, latitud: 1.853500, longitud: -76.051200, poligonoGeojson: cuadrado(1.853500, -76.051200, 0.0012), fechaVerificacionDeforestacion: fecha(-30) },
  { idFinca: 4, idProductor: 3, nombreFinca: 'Los Naranjos', areaHectareas: 2.1, latitud: 2.402300, longitud: -76.682100, poligonoGeojson: null, fechaVerificacionDeforestacion: null },
]

const PRODUCTOS = [
  { idProducto: 1, tipo: 'CAFE', nombreComercial: 'Café verde excelso', variedad: 'Castillo', codigoHs: '090111', unidadMedida: 'KG' },
  { idProducto: 2, tipo: 'CACAO', nombreComercial: 'Cacao en grano fino de aroma', variedad: 'CCN-51', codigoHs: '180100', unidadMedida: 'KG' },
]

const LOTES = [
  { idLote: 1, codigoLote: 'LT-2026-0001', idProducto: 1, pesoNetoKg: 19200, pesoBrutoKg: 19450, fechaCosecha: fecha(-80), fechaRegistro: fechaHora(-75), estadoLote: 'ASIGNADO' },
  { idLote: 2, codigoLote: 'LT-2026-0002', idProducto: 1, pesoNetoKg: 12000, pesoBrutoKg: 12180, fechaCosecha: fecha(-20), fechaRegistro: fechaHora(-15), estadoLote: 'EN_INSPECCION' },
  { idLote: 3, codigoLote: 'LT-2026-0003', idProducto: 2, pesoNetoKg: 8500, pesoBrutoKg: 8640, fechaCosecha: fecha(-12), fechaRegistro: fechaHora(-10), estadoLote: 'REGISTRADO' },
  { idLote: 4, codigoLote: 'LT-2026-0004', idProducto: 2, pesoNetoKg: 6000, pesoBrutoKg: 6100, fechaCosecha: fecha(-40), fechaRegistro: fechaHora(-35), estadoLote: 'RECHAZADO' },
  { idLote: 5, codigoLote: 'LT-2026-0005', idProducto: 1, pesoNetoKg: 18000, pesoBrutoKg: 18240, fechaCosecha: fecha(-60), fechaRegistro: fechaHora(-55), estadoLote: 'EXPORTADO' },
  { idLote: 6, codigoLote: 'LT-2026-0006', idProducto: 2, pesoNetoKg: 15000, pesoBrutoKg: 15200, fechaCosecha: fecha(-70), fechaRegistro: fechaHora(-65), estadoLote: 'EXPORTADO' },
  { idLote: 7, codigoLote: 'LT-2025-0112', idProducto: 1, pesoNetoKg: 16000, pesoBrutoKg: 16210, fechaCosecha: fecha(-95), fechaRegistro: fechaHora(-90), estadoLote: 'EXPORTADO' },
  { idLote: 8, codigoLote: 'LT-2026-0007', idProducto: 1, pesoNetoKg: 9600, pesoBrutoKg: 9730, fechaCosecha: fecha(-25), fechaRegistro: fechaHora(-22), estadoLote: 'APROBADO' },
  { idLote: 9, codigoLote: 'LT-2026-0008', idProducto: 2, pesoNetoKg: 7200, pesoBrutoKg: 7300, fechaCosecha: fecha(-18), fechaRegistro: fechaHora(-16), estadoLote: 'APROBADO' },
]

const INSPECCIONES = [
  { idInspeccion: 1, idLote: 1, idUsuarioInspector: 3, fechaInspeccion: fecha(-70), humedadPorcentaje: 11.2, defectosPor300g: 4, puntajeTaza: 84.5, ocratoxinaPpb: 1.1, aflatoxinasPpb: 0.4, resultado: 'APROBADO', observaciones: 'Grano uniforme, perfil achocolatado' },
  { idInspeccion: 2, idLote: 4, idUsuarioInspector: 3, fechaInspeccion: fecha(-30), humedadPorcentaje: 9.8, defectosPor300g: 18, puntajeTaza: null, ocratoxinaPpb: 3.4, aflatoxinasPpb: 2.9, resultado: 'RECHAZADO', observaciones: 'Moho visible en el 6% de la muestra y fermentación incompleta' },
  { idInspeccion: 3, idLote: 5, idUsuarioInspector: 3, fechaInspeccion: fecha(-50), humedadPorcentaje: 11.0, defectosPor300g: 3, puntajeTaza: 85.25, ocratoxinaPpb: 0.9, aflatoxinasPpb: 0.2, resultado: 'APROBADO', observaciones: 'Taza limpia, acidez brillante' },
  { idInspeccion: 4, idLote: 6, idUsuarioInspector: 3, fechaInspeccion: fecha(-60), humedadPorcentaje: 7.1, defectosPor300g: 5, puntajeTaza: null, ocratoxinaPpb: 0.6, aflatoxinasPpb: 1.8, resultado: 'APROBADO', observaciones: 'Fermentación completa, corte 92% marrón' },
  { idInspeccion: 5, idLote: 7, idUsuarioInspector: 3, fechaInspeccion: fecha(-85), humedadPorcentaje: 11.4, defectosPor300g: 6, puntajeTaza: 83.0, ocratoxinaPpb: 1.4, aflatoxinasPpb: 0.3, resultado: 'APROBADO', observaciones: null },
  { idInspeccion: 6, idLote: 8, idUsuarioInspector: 3, fechaInspeccion: fecha(-18), humedadPorcentaje: 10.9, defectosPor300g: 4, puntajeTaza: 84.0, ocratoxinaPpb: 1.2, aflatoxinasPpb: 0.3, resultado: 'APROBADO', observaciones: 'Perfil panela y cítricos' },
  { idInspeccion: 7, idLote: 9, idUsuarioInspector: 3, fechaInspeccion: fecha(-12), humedadPorcentaje: 7.4, defectosPor300g: 7, puntajeTaza: null, ocratoxinaPpb: 0.8, aflatoxinasPpb: 2.4, resultado: 'APROBADO', observaciones: null },
]

const ORIGEN = {
  1: [[1, 2, 60, 11520], [1, 1, 40, 7680]],
  2: [[1, 2, 100, 12000]],
  3: [[2, 3, 100, 8500]],
  4: [[3, 4, 100, 6000]],
  5: [[1, 1, 100, 18000]],
  6: [[2, 3, 100, 15000]],
  7: [[1, 2, 100, 16000]],
  8: [[1, 2, 50, 4800], [1, 1, 50, 4800]],
  9: [[2, 3, 100, 7200]],
}

const CUENTAS = [
  { idUsuario: 1, rol: 'ADMINISTRADOR', idCliente: null, nombreCompleto: 'Felipe Ceron', email: 'admin@ritech.co', estado: 'ACTIVO', ultimoAcceso: fechaHora(0, 8) },
  { idUsuario: 2, rol: 'GESTOR_EXPORTACIONES', idCliente: null, nombreCompleto: 'Manuel Alejandro Villarreal', email: 'gestor@ritech.co', estado: 'ACTIVO', ultimoAcceso: fechaHora(-1, 15) },
  { idUsuario: 3, rol: 'INSPECTOR_CALIDAD', idCliente: null, nombreCompleto: 'Camilo Bolaños', email: 'inspector@ritech.co', estado: 'ACTIVO', ultimoAcceso: fechaHora(-2, 10) },
  { idUsuario: 4, rol: 'CLIENTE_UE', idCliente: 1, nombreCompleto: 'Kaffeehaus Import GmbH', email: 'cliente@importadora-eu.com', estado: 'ACTIVO', ultimoAcceso: fechaHora(-3, 11) },
  { idUsuario: 5, rol: 'INSPECTOR_CALIDAD', idCliente: null, nombreCompleto: 'Laura Muñoz Ortega', email: 'lmunoz@ritech.co', estado: 'INACTIVO', ultimoAcceso: fechaHora(-60, 9) },
]
const vistaUsuario = (u) => ({ ...u, rol: ROLES.find((r) => r.nombreRol === u.rol) })

const AUDITORIA = [
  [-1, 2, 'lotes_exportacion', '3', 'INSERT', null, { codigo_lote: 'LT-2026-0003', estado_lote: 'REGISTRADO', peso_neto_kg: 8500 }],
  [-2, 3, 'inspecciones_calidad', '2', 'INSERT', null, { id_lote: 4, resultado: 'RECHAZADO', humedad_porcentaje: 9.8 }],
  [-2, 3, 'lotes_exportacion', '4', 'UPDATE', { estado_lote: 'EN_INSPECCION' }, { estado_lote: 'RECHAZADO' }],
  [-4, 2, 'clientes_ue', '2', 'UPDATE', { ciudad: 'Rotterdam', estado: 'ACTIVO' }, { ciudad: 'Róterdam', estado: 'ACTIVO' }],
  [-6, 2, 'clientes_ue', '3', 'INSERT', null, { razon_social: 'Cacao Bleu SAS', numero_eori: 'FR123456789012', id_pais: 10, ciudad: 'Burdeos' }],
  [-9, 1, 'clientes_ue', '5', 'DELETE', { razon_social: 'Prueba QA', numero_eori: 'ES000000000000' }, null],
  [-15, 3, 'inspecciones_calidad', '1', 'INSERT', null, { id_lote: 1, resultado: 'APROBADO', puntaje_taza: 84.5 }],
  [-15, 3, 'lotes_exportacion', '1', 'UPDATE', { estado_lote: 'EN_INSPECCION' }, { estado_lote: 'APROBADO' }],
].map(([d, idUsuario, tablaAfectada, idRegistro, accion, valorAnterior, valorNuevo], i) => ({
  idAuditoria: 100 - i, idUsuario, tablaAfectada, idRegistro, accion, valorAnterior, valorNuevo,
  fechaHora: fechaHora(d, 10 + (i % 6)), ipOrigen: '190.85.12.' + (20 + idUsuario),
}))

function guardarUsuarioDemo(id, u) {
  const email = u.email.trim().toLowerCase()
  if (CUENTAS.some((x) => x.email === email && x.idUsuario !== id)) throw errorDemo(409, 'Ya existe un usuario con ese correo.')
  if (!ROLES.some((r) => r.nombreRol === u.rol)) throw errorDemo(400, `El rol '${u.rol}' no existe.`)
  const idCliente = u.rol === 'CLIENTE_UE' ? u.idCliente : null
  if (u.rol === 'CLIENTE_UE' && !idCliente) throw errorDemo(400, 'Un usuario con rol CLIENTE_UE debe indicar idCliente.')
  if (idCliente && CUENTAS.some((x) => x.idCliente === idCliente && x.idUsuario !== id)) throw errorDemo(409, 'Ese cliente ya tiene una cuenta de acceso.')
  const datos = { nombreCompleto: u.nombreCompleto.trim(), email, rol: u.rol, idCliente }
  if (id) {
    const actual = CUENTAS.find((x) => x.idUsuario === id)
    if (id === 1 && u.rol !== actual.rol) throw errorDemo(400, 'No puede cambiar su propio rol.')
    return vistaUsuario(Object.assign(actual, datos))
  }
  const nuevo = { idUsuario: Math.max(...CUENTAS.map((x) => x.idUsuario)) + 1, ...datos, estado: 'ACTIVO', ultimoAcceso: null }
  CUENTAS.push(nuevo)
  return vistaUsuario(nuevo)
}

const TRANSPORTISTAS = [
  ['Maersk Line', 'NAVIERA', 'bookings@maersk-co.example'],
  ['Hapag-Lloyd', 'NAVIERA', 'export@hapag-co.example'],
  ['CMA CGM', 'NAVIERA', 'export@cma-cgm.example'],
  ['Avianca Cargo', 'AEREA', 'cargo@avianca-co.example'],
  ['Transportes Andinos', 'TERRESTRE', 'despachos@tandinos.example'],
].map(([nombre, tipo, contacto], i) => ({ idTransportista: i + 1, nombre, tipo, contacto }))

const ORDENES = [
  [1, 'ORD-2026-0001', 1, -26, 'FOB', 'EUR', 'EN_TRANSITO'],
  [2, 'ORD-2026-0002', 3, -36, 'CIF', 'EUR', 'EN_TRANSITO'],
  [3, 'ORD-2026-0003', 2, -56, 'FOB', 'USD', 'ENTREGADA'],
  [4, 'ORD-2026-0004', 2, -3, 'DAP', 'EUR', 'CONFIRMADA'],
  [5, 'ORD-2026-0005', 1, 0, 'FCA', 'EUR', 'BORRADOR'],
].map(([idOrden, numeroOrden, idCliente, d, incoterm, moneda, estadoOrden]) => ({
  idOrden, numeroOrden, idCliente, idUsuarioGestor: 2, fechaOrden: fecha(d), incoterm, moneda, valorTotal: 0, estadoOrden,
}))

const ORDENES_LOTES = [
  { idOrden: 1, idLote: 5, kgAsignados: 18000, precioUnitario: 6.85 },
  { idOrden: 2, idLote: 6, kgAsignados: 15000, precioUnitario: 7.4 },
  { idOrden: 3, idLote: 7, kgAsignados: 16000, precioUnitario: 6.2 },
  { idOrden: 4, idLote: 1, kgAsignados: 19200, precioUnitario: 7.1 },
]

const recalcularOrden = (o) => {
  o.valorTotal = Math.round(ORDENES_LOTES.filter((a) => a.idOrden === o.idOrden).reduce((s, a) => s + a.kgAsignados * a.precioUnitario, 0) * 100) / 100
  return o
}
ORDENES.forEach(recalcularOrden)

const TRANSICIONES_ORDEN = {
  BORRADOR: ['CONFIRMADA', 'ANULADA'],
  CONFIRMADA: ['EN_TRANSITO', 'ANULADA', 'BORRADOR'],
  EN_TRANSITO: ['ENTREGADA'],
  ENTREGADA: [],
  ANULADA: [],
}

function detalleOrdenDemo(o) {
  return { orden: recalcularOrden(o), cliente: CLIENTES.find((c) => c.idCliente === o.idCliente) ?? null, lotes: ORDENES_LOTES.filter((a) => a.idOrden === o.idOrden) }
}

function ordenDemo(id, sesion) {
  const o = ORDENES.find((x) => x.idOrden === id)
  if (!o || (sesion?.idCliente && o.idCliente !== sesion.idCliente)) throw errorDemo(404, 'La orden no existe.')
  return o
}

function ordenEnBorrador(id) {
  const o = ordenDemo(id)
  if (o.estadoOrden !== 'BORRADOR') throw errorDemo(400, `Solo se modifica una orden en BORRADOR (esta ${o.estadoOrden}).`)
  return o
}

const CERTIFICACIONES = [
  ['FITOSANITARIO', 'Certificado Fitosanitario', 'ICA - Instituto Colombiano Agropecuario', true],
  ['ORIGEN', 'Certificado de Origen', 'Camara de Comercio', true],
  ['CALIDAD_FNC', 'Certificado de Calidad del Cafe', 'Federacion Nacional de Cafeteros', false],
  ['ORGANICO', 'Certificacion Organica UE', 'Organismo de control acreditado', false],
  ['FAIRTRADE', 'Certificacion de Comercio Justo', 'Fairtrade International', false],
  ['GLOBALGAP', 'Certificacion GLOBALG.A.P.', 'Organismo certificador acreditado', false],
].map(([codigo, nombre, entidadEmisora, obligatoriaUe], i) => ({ idCertificacion: i + 1, codigo, nombre, entidadEmisora, obligatoriaUe }))

const CERTIFICADOS = [
  [1, 1, 'ICA-FIT-2026-08812', -60, 12], [1, 2, 'CCC-ORI-2026-1102', -60, 120], [1, 3, 'FNC-CAL-55120', -70, 25],
  [5, 1, 'ICA-FIT-2026-07455', -50, 40], [5, 2, 'CCC-ORI-2026-0988', -50, 200],
  [6, 1, 'ICA-FIT-2026-07121', -62, 6], [6, 2, 'CCC-ORI-2026-0951', -62, 180], [6, 5, 'FLO-ID-30122', -300, 65],
  [7, 1, 'ICA-FIT-2025-11870', -100, -10], [7, 2, 'CCC-ORI-2025-2210', -100, 150],
  [8, 1, 'ICA-FIT-2026-09140', -15, 75], [8, 2, 'CCC-ORI-2026-1215', -15, 200], [8, 4, 'ORG-EU-CO-7781', -200, 28],
  [9, 1, 'ICA-FIT-2026-09302', -10, 80], [9, 2, 'CCC-ORI-2026-1240', -10, 210],
].map(([idLote, idCertificacion, numeroDocumento, em, ve]) => ({
  idLote, idCertificacion, numeroDocumento, fechaEmision: fecha(em), fechaVencimiento: fecha(ve),
  urlSoporte: idLote === 1 && idCertificacion === 1 ? 'demo/fitosanitario.pdf' : null,
  estadoValidacion: ve < 0 ? 'VENCIDO' : 'VIGENTE',
}))

const REGLAS = [
  ['R-UE-001', 'Reglamento (UE) 2023/1115 - EUDR', 'AMBOS', 'LOTE', 'geolocalizacion_fincas', '=', '100', 'Todas las fincas de origen deben tener geolocalizacion registrada (EUDR).'],
  ['R-UE-002', 'Reglamento (UE) 2023/1115 - EUDR', 'AMBOS', 'LOTE', 'poligono_si_area_mayor_4ha', '=', 'true', 'Las fincas con mas de 4 hectareas requieren poligono de geolocalizacion.'],
  ['R-UE-003', 'Reglamento (CE) 178/2002', 'AMBOS', 'LOTE', 'suma_aportes_finca', '=', '100', 'La suma de los aportes de finca debe ser exactamente 100%.'],
  ['R-UE-004', 'Reglamento (UE) 2023/915', 'CAFE', 'LOTE', 'ocratoxina_a_cafe', '<=', '5.0', 'La ocratoxina A supera el limite de 5,0 ug/kg del Reglamento (UE) 2023/915.'],
  ['R-UE-005', 'Reglamento (UE) 2023/915', 'CACAO', 'LOTE', 'aflatoxinas_cacao', '<=', '10.0', 'La suma de aflatoxinas supera el limite de 10,0 ug/kg.'],
  ['R-UE-006', 'Practica comercial ICO / SCA', 'CAFE', 'LOTE', 'humedad_cafe_verde', '<=', '12.5', 'La humedad excede el maximo de 12,5% admitido para cafe verde de exportacion.'],
  ['R-UE-007', 'Reglamento (UE) 2016/2031', 'AMBOS', 'LOTE', 'certificado_fitosanitario_vigente', '=', 'true', 'Certificado fitosanitario obligatorio ausente o vencido.'],
  ['R-UE-008', 'Reglamento (UE) 952/2013 - Codigo Aduanero', 'AMBOS', 'ORDEN', 'eori_importador_valido', '=', 'true', 'El importador debe tener un EORI valido y pertenecer a un pais miembro de la UE.'],
].map(([codigoRegla, normativaReferencia, aplicaTipo, ambito, parametro, operador, valorLimite, mensajeError], i) => ({
  idRegla: i + 1, codigoRegla, normativaReferencia, idProducto: null, aplicaTipo, ambito, parametro, operador, valorLimite, mensajeError, activa: true,
}))

const PARAMETROS_LOTE = {
  geolocalizacion_fincas: '% de fincas de origen con latitud y longitud',
  suma_aportes_finca: 'suma de porcentajes de aporte',
  ocratoxina_a_cafe: 'ocratoxina A de la ultima inspeccion (ug/kg)',
  aflatoxinas_cacao: 'aflatoxinas de la ultima inspeccion (ug/kg)',
  humedad_cafe_verde: 'humedad de la ultima inspeccion (%)',
  certificado_fitosanitario_vigente: '1 si hay fitosanitario vigente',
}

const VALIDACIONES = {}

function compara(valor, operador, limite) {
  const a = valor === 'true' ? 1 : valor === 'false' ? 0 : Number(valor)
  const b = limite === 'true' ? 1 : limite === 'false' ? 0 : Number(limite)
  return { '=': Math.abs(a - b) < 0.0001, '<>': a !== b, '<': a < b, '<=': a <= b, '>': a > b, '>=': a >= b }[operador]
}

/** Imita sp_validar_lote: evalúa cada regla activa de ámbito LOTE que aplica al tipo de producto. */
function validarLoteDemo(l) {
  const tipo = PRODUCTOS.find((p) => p.idProducto === l.idProducto)?.tipo
  const origen = ORIGEN[l.idLote] ?? []
  const fincas = origen.map((o) => FINCAS.find((f) => f.idFinca === o[1])).filter(Boolean)
  const insp = INSPECCIONES.filter((i) => i.idLote === l.idLote).sort((a, b) => b.fechaInspeccion.localeCompare(a.fechaInspeccion))[0]
  const fito = CERTIFICADOS.some((c) => c.idLote === l.idLote && c.idCertificacion === 1 && c.estadoValidacion === 'VIGENTE' && c.fechaVencimiento >= fecha(0))
  const valores = {
    geolocalizacion_fincas: fincas.length ? String(Math.round((fincas.filter((f) => f.latitud != null && f.longitud != null).length / fincas.length) * 100)) : '0',
    poligono_si_area_mayor_4ha: String(fincas.length > 0 && fincas.every((f) => Number(f.areaHectareas) <= 4 || f.poligonoGeojson)),
    suma_aportes_finca: String(origen.reduce((a, o) => a + o[2], 0)),
    ocratoxina_a_cafe: insp?.ocratoxinaPpb != null ? String(insp.ocratoxinaPpb) : null,
    aflatoxinas_cacao: insp?.aflatoxinasPpb != null ? String(insp.aflatoxinasPpb) : null,
    humedad_cafe_verde: insp?.humedadPorcentaje != null ? String(insp.humedadPorcentaje) : null,
    certificado_fitosanitario_vigente: String(fito),
  }
  const detalle = REGLAS.filter((r) => r.activa && r.ambito === 'LOTE' && (r.aplicaTipo === 'AMBOS' || r.aplicaTipo === tipo)).map((r) => {
    const v = valores[r.parametro] ?? null
    const ok = v !== null && compara(v, r.operador, r.valorLimite)
    return { codigoRegla: r.codigoRegla, normativa: r.normativaReferencia, parametro: r.parametro, operador: r.operador, valorLimite: r.valorLimite, valorEvaluado: v, resultado: ok ? 'CUMPLE' : 'NO_CUMPLE', mensaje: ok ? null : r.mensajeError }
  })
  VALIDACIONES[l.idLote] = { fecha: new Date().toISOString().slice(0, 19), detalle }
}

function dictamenDemo(l) {
  const v = VALIDACIONES[l.idLote]
  const incumplidas = v ? v.detalle.filter((d) => d.resultado === 'NO_CUMPLE').length : 0
  return {
    idLote: l.idLote, codigoLote: l.codigoLote, estadoLote: l.estadoLote, ultimaValidacion: v?.fecha ?? null,
    reglasEvaluadas: v?.detalle.length ?? 0, reglasIncumplidas: incumplidas,
    dictamen: !v ? 'SIN_VALIDAR' : incumplidas ? 'NO_CUMPLE' : 'CUMPLE', detalle: v?.detalle ?? [],
  }
}

function usuarioDemo() {
  try {
    return JSON.parse(localStorage.getItem('ritech.sesion'))?.usuario ?? null
  } catch {
    return null
  }
}

function guardarLoteDemo(id, c) {
  const p = PRODUCTOS.find((x) => x.idProducto === c.idProducto)
  if (!p) throw errorDemo(400, 'El producto no existe.')
  if (c.pesoBrutoKg < c.pesoNetoKg) throw errorDemo(400, 'El peso bruto no puede ser menor que el peso neto.')
  let codigo = c.codigoLote
  if (!codigo) {
    const prefijo = `${p.tipo === 'CAFE' ? 'CAF' : 'CAC'}-${hoy.getFullYear()}-`
    codigo = prefijo + String(LOTES.filter((l) => l.codigoLote.startsWith(prefijo)).length + 1).padStart(4, '0')
  }
  if (LOTES.some((l) => l.codigoLote === codigo && l.idLote !== id)) throw errorDemo(409, `Ya existe un lote con el codigo ${codigo}.`)
  const datos = { codigoLote: codigo, idProducto: c.idProducto, pesoNetoKg: c.pesoNetoKg, pesoBrutoKg: c.pesoBrutoKg, fechaCosecha: c.fechaCosecha }
  if (id) {
    const l = LOTES.find((x) => x.idLote === id)
    if (l.estadoLote !== 'REGISTRADO') throw errorDemo(400, 'Solo se puede editar un lote en estado REGISTRADO.')
    if (l.pesoNetoKg !== c.pesoNetoKg && ORIGEN[id]?.length) throw errorDemo(400, 'El lote ya tiene fincas asociadas: retirelas antes de cambiar el peso neto.')
    return Object.assign(l, datos)
  }
  const nuevo = { idLote: Math.max(...LOTES.map((l) => l.idLote)) + 1, ...datos, fechaRegistro: new Date().toISOString().slice(0, 19), estadoLote: 'REGISTRADO' }
  LOTES.push(nuevo)
  return nuevo
}

const errorDemo = (estado, mensaje) => Object.assign(new Error(mensaje), { estado, campos: {} })

function guardarClienteDemo(id, c) {
  const pais = PAISES.find((p) => p.idPais === Number(c.idPais))
  if (!pais?.perteneceUe) throw errorDemo(422, 'El pais del importador debe ser miembro de la Union Europea.')
  if (CLIENTES.some((x) => x.numeroEori === c.numeroEori && x.idCliente !== id)) {
    throw errorDemo(409, `Ya existe un cliente con el EORI ${c.numeroEori}.`)
  }
  if (id) {
    const actual = CLIENTES.find((x) => x.idCliente === id)
    if (!actual) throw errorDemo(404, 'El cliente no existe.')
    Object.assign(actual, c, { estado: c.estado ?? actual.estado })
    return actual
  }
  const nuevo = { ...c, idCliente: Math.max(...CLIENTES.map((x) => x.idCliente)) + 1, estado: c.estado ?? 'ACTIVO', creadoEn: new Date().toISOString().slice(0, 19) }
  CLIENTES.push(nuevo)
  return nuevo
}

function guardarProductorDemo(id, p) {
  if (PRODUCTORES.some((x) => x.nitOCedula === p.nitOCedula && x.idProductor !== id)) {
    throw errorDemo(409, `Ya existe un productor con el NIT o cedula ${p.nitOCedula}.`)
  }
  if (id) return Object.assign(PRODUCTORES.find((x) => x.idProductor === id), p)
  const nuevo = { ...p, idProductor: Math.max(...PRODUCTORES.map((x) => x.idProductor)) + 1 }
  PRODUCTORES.push(nuevo)
  return nuevo
}

function guardarFincaDemo(id, idProductor, f) {
  if (Number(f.areaHectareas) > 4 && !f.poligonoGeojson) {
    throw errorDemo(400, 'Las fincas de mas de 4 hectareas requieren poligono de geolocalizacion (EUDR).')
  }
  const datos = { ...f, poligonoGeojson: f.poligonoGeojson ? JSON.stringify(f.poligonoGeojson) : null }
  if (id) return Object.assign(FINCAS.find((x) => x.idFinca === id), datos)
  const nueva = { ...datos, idFinca: Math.max(...FINCAS.map((x) => x.idFinca)) + 1, idProductor }
  FINCAS.push(nueva)
  return nueva
}

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

  if (camino === '/api/roles') return ROLES
  if (camino === '/api/usuarios' && metodo === 'GET') return [...CUENTAS].sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)).map(vistaUsuario)
  if (camino === '/api/usuarios' && metodo === 'POST') return guardarUsuarioDemo(null, cuerpo)
  const cuenta = camino.match(/^\/api\/usuarios\/(\d+)(\/estado)?$/)
  if (cuenta && metodo === 'PUT') return guardarUsuarioDemo(Number(cuenta[1]), cuerpo)
  if (cuenta && metodo === 'PATCH') {
    if (Number(cuenta[1]) === 1 && cuerpo.estado !== 'ACTIVO') throw errorDemo(400, 'No puede inactivar ni bloquear su propia cuenta.')
    const u = CUENTAS.find((x) => x.idUsuario === Number(cuenta[1]))
    u.estado = cuerpo.estado
    return vistaUsuario(u)
  }
  if (camino === '/api/auditoria') {
    const q = new URLSearchParams(consulta)
    const desde = q.get('desde'), hasta = q.get('hasta')
    const filas = AUDITORIA.filter((a) =>
      (!q.get('tabla') || a.tablaAfectada === q.get('tabla')) &&
      (!q.get('idUsuario') || a.idUsuario === Number(q.get('idUsuario'))) &&
      (!desde || a.fechaHora.slice(0, 10) >= desde) &&
      (!hasta || a.fechaHora.slice(0, 10) <= hasta))
    const tamano = Number(q.get('tamano') ?? 50), pagina = Number(q.get('pagina') ?? 0)
    return { content: filas.slice(pagina * tamano, (pagina + 1) * tamano), totalElements: filas.length, totalPages: Math.max(1, Math.ceil(filas.length / tamano)), number: pagina, size: tamano }
  }

  if (camino === '/api/transportistas') return TRANSPORTISTAS
  if (camino === '/api/ordenes' && metodo === 'GET') {
    const q = new URLSearchParams(consulta)
    const yo = usuarioDemo()
    const idCliente = yo?.idCliente ?? (q.get('idCliente') ? Number(q.get('idCliente')) : null)
    return ORDENES.filter((o) => (!idCliente || o.idCliente === idCliente) && (!q.get('estado') || o.estadoOrden === q.get('estado')))
      .map(recalcularOrden).sort((a, b) => b.fechaOrden.localeCompare(a.fechaOrden) || b.idOrden - a.idOrden)
  }
  if (camino === '/api/ordenes' && metodo === 'POST') {
    const c = CLIENTES.find((x) => x.idCliente === cuerpo.idCliente)
    if (!c) throw errorDemo(400, 'El cliente no existe.')
    if (c.estado !== 'ACTIVO') throw errorDemo(400, 'No se puede crear una orden para un cliente inactivo.')
    const n = Math.max(...ORDENES.map((o) => o.idOrden)) + 1
    const o = { idOrden: n, numeroOrden: `ORD-${hoy.getFullYear()}-${String(n).padStart(4, '0')}`, idCliente: c.idCliente, idUsuarioGestor: 2,
      fechaOrden: cuerpo.fechaOrden || fecha(0), incoterm: cuerpo.incoterm, moneda: cuerpo.moneda || 'EUR', valorTotal: 0, estadoOrden: 'BORRADOR' }
    ORDENES.push(o)
    return o
  }
  const orden = camino.match(/^\/api\/ordenes\/(\d+)(?:\/(estado|lotes|envios))?(?:\/(\d+))?$/)
  if (orden) {
    const id = Number(orden[1])
    if (!orden[2] && metodo === 'GET') return detalleOrdenDemo(ordenDemo(id, usuarioDemo()))
    if (!orden[2] && metodo === 'PUT') {
      const o = ordenEnBorrador(id)
      if (o.idCliente !== cuerpo.idCliente && ORDENES_LOTES.some((a) => a.idOrden === id)) throw errorDemo(400, 'Retire los lotes antes de cambiar el cliente de la orden.')
      return Object.assign(o, { idCliente: cuerpo.idCliente, fechaOrden: cuerpo.fechaOrden || o.fechaOrden, incoterm: cuerpo.incoterm, moneda: cuerpo.moneda || o.moneda })
    }
    if (orden[2] === 'estado') {
      const o = ordenDemo(id)
      if (!TRANSICIONES_ORDEN[o.estadoOrden].includes(cuerpo.estado)) throw errorDemo(400, `No se puede pasar una orden de ${o.estadoOrden} a ${cuerpo.estado}.`)
      if (cuerpo.estado === 'CONFIRMADA' && !ORDENES_LOTES.some((a) => a.idOrden === id)) throw errorDemo(400, 'Una orden sin lotes no se puede confirmar.')
      if (cuerpo.estado === 'ANULADA') {
        for (let i = ORDENES_LOTES.length - 1; i >= 0; i--) {
          if (ORDENES_LOTES[i].idOrden === id) {
            LOTES.find((l) => l.idLote === ORDENES_LOTES[i].idLote).estadoLote = 'APROBADO'
            ORDENES_LOTES.splice(i, 1)
          }
        }
      }
      o.estadoOrden = cuerpo.estado
      return recalcularOrden(o)
    }
    if (orden[2] === 'lotes' && metodo === 'POST') {
      ordenEnBorrador(id)
      const l = LOTES.find((x) => x.idLote === cuerpo.idLote)
      if (!l) throw errorDemo(404, 'El lote no existe.')
      if (l.estadoLote !== 'APROBADO') throw errorDemo(400, `Solo pueden asignarse lotes en estado APROBADO (el lote esta ${l.estadoLote}).`)
      const kg = cuerpo.kgAsignados ?? l.pesoNetoKg
      if (kg > l.pesoNetoKg) throw errorDemo(400, `Se asignan ${kg} kg y el lote solo tiene ${l.pesoNetoKg} kg disponibles.`)
      ORDENES_LOTES.push({ idOrden: id, idLote: l.idLote, kgAsignados: kg, precioUnitario: cuerpo.precioUnitario })
      l.estadoLote = 'ASIGNADO'
      return detalleOrdenDemo(ordenDemo(id))
    }
    if (orden[2] === 'lotes' && orden[3]) {
      ordenEnBorrador(id)
      const i = ORDENES_LOTES.findIndex((a) => a.idOrden === id && a.idLote === Number(orden[3]))
      if (i < 0) throw errorDemo(404, 'El lote en esta orden no existe.')
      const l = LOTES.find((x) => x.idLote === Number(orden[3]))
      if (metodo === 'DELETE') {
        ORDENES_LOTES.splice(i, 1)
        l.estadoLote = 'APROBADO'
      } else {
        if (cuerpo.kgAsignados > l.pesoNetoKg) throw errorDemo(400, `El lote solo tiene ${l.pesoNetoKg} kg disponibles.`)
        Object.assign(ORDENES_LOTES[i], { kgAsignados: cuerpo.kgAsignados, precioUnitario: cuerpo.precioUnitario })
      }
      return detalleOrdenDemo(ordenDemo(id))
    }
    if (orden[2] === 'envios' && metodo === 'POST') {
      const o = ordenDemo(id)
      if (o.estadoOrden !== 'CONFIRMADA') throw errorDemo(400, `Solo se programa el envio de una orden CONFIRMADA (esta ${o.estadoOrden}).`)
      const t = TRANSPORTISTAS.find((x) => x.idTransportista === cuerpo.idTransportista)
      if (!t) throw errorDemo(400, 'El transportista no existe.')
      if (cuerpo.fechaEstimadaZarpe && cuerpo.fechaEstimadaArribo && cuerpo.fechaEstimadaArribo < cuerpo.fechaEstimadaZarpe) throw errorDemo(400, 'El arribo estimado no puede ser anterior al zarpe.')
      if (cuerpo.bookingBl && ENVIOS.some((e) => e.envio.bookingBl === cuerpo.bookingBl)) throw errorDemo(409, `Ya existe un envio con el booking/BL ${cuerpo.bookingBl}.`)
      if (ENVIOS.some((e) => e.envio.idOrden === id)) throw errorDemo(409, 'La orden ya tiene un envio programado.')
      const idEnvio = Math.max(...ENVIOS.map((e) => e.envio.idEnvio)) + 1
      const nuevo = {
        envio: { idEnvio, idOrden: id, ...cuerpo, estadoEnvio: 'PROGRAMADO' },
        transportista: t.nombre, numeroOrden: o.numeroOrden,
        seguimiento: [{ idSeguimiento: 900 + idEnvio, fechaEvento: new Date().toISOString().slice(0, 19), ubicacion: cuerpo.puertoOrigen, estado: 'PROGRAMADO', observacion: 'Envío programado' }],
      }
      ENVIOS.push(nuevo)
      return nuevo
    }
  }

  if (camino === '/api/productores' && metodo === 'GET') return [...PRODUCTORES].sort((a, b) => a.nombre.localeCompare(b.nombre))
  if (camino === '/api/productores' && metodo === 'POST') return guardarProductorDemo(null, cuerpo)
  const productor = camino.match(/^\/api\/productores\/(\d+)$/)
  if (productor && metodo === 'GET') {
    const encontrado = PRODUCTORES.find((p) => p.idProductor === Number(productor[1]))
    if (!encontrado) throw errorDemo(404, 'El productor no existe.')
    return encontrado
  }
  if (productor && metodo === 'PUT') return guardarProductorDemo(Number(productor[1]), cuerpo)
  const fincasDe = camino.match(/^\/api\/productores\/(\d+)\/fincas$/)
  if (fincasDe && metodo === 'GET') return FINCAS.filter((f) => f.idProductor === Number(fincasDe[1])).sort((a, b) => a.nombreFinca.localeCompare(b.nombreFinca))
  if (fincasDe && metodo === 'POST') return guardarFincaDemo(null, Number(fincasDe[1]), cuerpo)
  const finca = camino.match(/^\/api\/fincas\/(\d+)$/)
  if (finca && metodo === 'PUT') return guardarFincaDemo(Number(finca[1]), null, cuerpo)

  if (camino === '/api/productos') return PRODUCTOS
  if (camino === '/api/lotes' && metodo === 'GET') {
    const q = new URLSearchParams(consulta)
    return LOTES.filter((l) => (!q.get('estado') || l.estadoLote === q.get('estado')) && (!q.get('idProducto') || l.idProducto === Number(q.get('idProducto'))))
      .sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro))
  }
  if (camino === '/api/certificaciones') return CERTIFICACIONES
  if (camino === '/api/certificados/por-vencer') {
    const dias = Number(new URLSearchParams(consulta).get('dias') ?? 30)
    const hoyD = fecha(0), limite = fecha(dias)
    return CERTIFICADOS.filter((c) => c.estadoValidacion === 'VIGENTE' && c.fechaVencimiento >= hoyD && c.fechaVencimiento <= limite)
      .map((c) => ({ idLote: c.idLote, codigoLote: LOTES.find((l) => l.idLote === c.idLote)?.codigoLote, certificado: CERTIFICACIONES.find((x) => x.idCertificacion === c.idCertificacion)?.nombre,
        numeroDocumento: c.numeroDocumento, fechaVencimiento: c.fechaVencimiento, diasRestantes: Math.round((new Date(c.fechaVencimiento) - new Date(hoyD)) / 86400000) }))
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
  }
  if (camino === '/api/reglas/parametros') return PARAMETROS_LOTE
  if (camino === '/api/reglas' && metodo === 'GET') return [...REGLAS].sort((a, b) => a.codigoRegla.localeCompare(b.codigoRegla))
  const regla = camino.match(/^\/api\/reglas(?:\/(\d+))?(\/activa)?$/)
  if (regla && metodo !== 'GET') {
    const id = regla[1] ? Number(regla[1]) : null
    if (regla[2]) {
      const r = REGLAS.find((x) => x.idRegla === id)
      r.activa = new URLSearchParams(consulta).get('valor') === 'true'
      return r
    }
    if (!PARAMETROS_LOTE[cuerpo.parametro] && cuerpo.parametro !== 'eori_importador_valido' && cuerpo.parametro !== 'poligono_si_area_mayor_4ha') throw errorDemo(400, 'Parametro desconocido.')
    if (cuerpo.valorLimite !== 'true' && Number.isNaN(Number(cuerpo.valorLimite))) throw errorDemo(400, "El valor limite debe ser un numero o 'true'.")
    const datos = { ...cuerpo, aplicaTipo: cuerpo.aplicaTipo ?? 'AMBOS', ambito: cuerpo.parametro === 'eori_importador_valido' ? 'ORDEN' : 'LOTE', activa: cuerpo.activa ?? true }
    if (id) {
      const r = REGLAS.find((x) => x.idRegla === id)
      if (r.codigoRegla !== cuerpo.codigoRegla) throw errorDemo(400, 'El codigo de una regla no se cambia; cree una nueva.')
      return Object.assign(r, datos)
    }
    if (REGLAS.some((r) => r.codigoRegla === cuerpo.codigoRegla)) throw errorDemo(409, `Ya existe la regla ${cuerpo.codigoRegla}.`)
    const nueva = { idRegla: Math.max(...REGLAS.map((r) => r.idRegla)) + 1, idProducto: null, ...datos }
    REGLAS.push(nueva)
    return nueva
  }
  const cumple = camino.match(/^\/api\/lotes\/(\d+)\/(certificados|validar|dictamen)(?:\/(\d+)\/soporte)?$/)
  if (cumple) {
    const l = LOTES.find((x) => x.idLote === Number(cumple[1]))
    if (!l) throw errorDemo(404, 'El lote no existe.')
    if (cumple[2] === 'validar') { validarLoteDemo(l); return dictamenDemo(l) }
    if (cumple[2] === 'dictamen') return dictamenDemo(l)
    if (cumple[3]) {
      const c = CERTIFICADOS.find((x) => x.idLote === l.idLote && x.idCertificacion === Number(cumple[3]))
      if (!c) throw errorDemo(404, 'El certificado no existe.')
      if (metodo === 'POST') {
        const f = cuerpo.archivo
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) throw errorDemo(400, 'El soporte debe ser PDF, JPG o PNG.')
        c.urlSoporte = `demo/${f.name}`
        c.archivoDemo = f
        return c
      }
      if (!c.urlSoporte) throw errorDemo(404, 'El soporte digitalizado no existe.')
      return c.archivoDemo ?? new Blob(['%PDF-1.4\n% Soporte de ejemplo del modo demo\n'], { type: 'application/pdf' })
    }
    if (metodo === 'GET') return CERTIFICADOS.filter((c) => c.idLote === l.idLote).map(({ archivoDemo, ...c }) => c)
    if (!CERTIFICACIONES.some((c) => c.idCertificacion === cuerpo.idCertificacion)) throw errorDemo(400, 'El tipo de certificado no existe.')
    if (cuerpo.fechaVencimiento <= cuerpo.fechaEmision) throw errorDemo(400, 'La fecha de vencimiento debe ser posterior a la fecha de emision.')
    if (cuerpo.fechaVencimiento <= fecha(0)) throw errorDemo(400, 'No es posible cargar un certificado ya vencido.')
    if (cuerpo.fechaEmision > fecha(0)) throw errorDemo(400, 'La fecha de emision no puede ser futura.')
    let c = CERTIFICADOS.find((x) => x.idLote === l.idLote && x.idCertificacion === cuerpo.idCertificacion)
    if (!c) { c = { idLote: l.idLote, idCertificacion: cuerpo.idCertificacion, urlSoporte: null }; CERTIFICADOS.push(c) }
    Object.assign(c, { numeroDocumento: cuerpo.numeroDocumento.trim(), fechaEmision: cuerpo.fechaEmision, fechaVencimiento: cuerpo.fechaVencimiento, estadoValidacion: 'VIGENTE' })
    const { archivoDemo, ...vista } = c
    return vista
  }
  if (camino === '/api/lotes' && metodo === 'POST') return guardarLoteDemo(null, cuerpo)
  const loteEdit = camino.match(/^\/api\/lotes\/(\d+)$/)
  if (loteEdit && metodo === 'PUT') return guardarLoteDemo(Number(loteEdit[1]), cuerpo)
  const aporte = camino.match(/^\/api\/lotes\/(\d+)\/(fincas|cerrar-trazabilidad)(?:\/(\d+))?$/)
  if (aporte) {
    const l = LOTES.find((x) => x.idLote === Number(aporte[1]))
    if (!l) throw errorDemo(404, 'El lote no existe.')
    const filas = (ORIGEN[l.idLote] ??= [])
    const pct = filas.reduce((a, f) => a + f[2], 0)
    const kg = filas.reduce((a, f) => a + f[3], 0)
    if (aporte[2] === 'cerrar-trazabilidad') {
      if (!filas.length) throw errorDemo(422, 'El lote debe tener al menos una finca de origen.')
      if (Math.abs(pct - 100) > 0.01) throw errorDemo(422, 'La suma de los aportes de finca debe ser exactamente 100%.')
      if (Math.abs(kg - l.pesoNetoKg) > l.pesoNetoKg * 0.005) throw errorDemo(422, 'La suma de kg aportados no coincide con el peso neto (tol. 0,5%).')
      return { mensaje: 'Trazabilidad completa', fincas_origen: filas.length, suma_porcentaje: pct, suma_kilogramos: kg }
    }
    const vista = (f) => ({ idLote: l.idLote, idFinca: f[1], porcentajeAporte: f[2], kgAportados: f[3] })
    if (metodo === 'GET') return [...filas].sort((a, b) => b[2] - a[2]).map(vista)
    if (!['REGISTRADO', 'EN_INSPECCION', 'RECHAZADO'].includes(l.estadoLote)) throw errorDemo(400, `El origen de un lote en estado ${l.estadoLote} ya no se puede modificar.`)
    const idFinca = aporte[3] ? Number(aporte[3]) : cuerpo.idFinca
    const i = filas.findIndex((f) => f[1] === idFinca)
    if (metodo === 'DELETE') {
      if (i < 0) throw errorDemo(404, 'La finca en este lote no existe.')
      filas.splice(i, 1)
      return null
    }
    const finca = FINCAS.find((f) => f.idFinca === idFinca)
    if (!finca) throw errorDemo(400, 'La finca no existe.')
    if (metodo === 'POST' && i >= 0) throw errorDemo(400, 'Esa finca ya está asociada al lote.')
    const otros = filas.filter((f) => f[1] !== idFinca).reduce((a, f) => a + f[2], 0)
    if (otros + Number(cuerpo.porcentajeAporte) > 100.001) throw errorDemo(400, `La suma de aportes superaría el 100% (ya hay ${otros}%).`)
    const kgF = cuerpo.kgAportados ?? Math.round(l.pesoNetoKg * cuerpo.porcentajeAporte) / 100
    const fila = [finca.idProductor, idFinca, Number(cuerpo.porcentajeAporte), kgF]
    if (i >= 0) filas[i] = fila
    else filas.push(fila)
    return vista(fila)
  }
  const lote = camino.match(/^\/api\/lotes\/(\d+)(\/\w+)?$/)
  if (lote) {
    const l = LOTES.find((x) => x.idLote === Number(lote[1]))
    if (!l) throw errorDemo(404, 'El lote no existe.')
    if (!lote[2]) return l
    if (lote[2] === '/inspecciones' && metodo === 'GET') {
      return INSPECCIONES.filter((i) => i.idLote === l.idLote).sort((a, b) => b.fechaInspeccion.localeCompare(a.fechaInspeccion) || b.idInspeccion - a.idInspeccion)
    }
    if (lote[2] === '/inspecciones' && metodo === 'POST') {
      if (!['REGISTRADO', 'EN_INSPECCION', 'RECHAZADO'].includes(l.estadoLote)) throw errorDemo(400, `No se puede inspeccionar un lote en estado ${l.estadoLote}.`)
      if (cuerpo.resultado === 'RECHAZADO' && (cuerpo.observaciones ?? '').trim().length < 20) {
        throw errorDemo(400, 'Para rechazar un lote la observacion es obligatoria (minimo 20 caracteres).')
      }
      const i = { ...cuerpo, idInspeccion: Math.max(...INSPECCIONES.map((x) => x.idInspeccion)) + 1, idLote: l.idLote, idUsuarioInspector: 3, fechaInspeccion: cuerpo.fechaInspeccion ?? fecha(0) }
      INSPECCIONES.push(i)
      if (cuerpo.resultado !== 'CONDICIONADO') l.estadoLote = cuerpo.resultado
      return { inspeccion: i, estadoLote: l.estadoLote }
    }
    if (lote[2] === '/trazabilidad') {
      const p = PRODUCTOS.find((x) => x.idProducto === l.idProducto)
      const origen = (ORIGEN[l.idLote] ?? []).map(([idP, idF, pct, kg]) => {
        const prod = PRODUCTORES.find((x) => x.idProductor === idP)
        const f = FINCAS.find((x) => x.idFinca === idF)
        return { productor: prod.nombre, nombreFinca: f.nombreFinca, areaHectareas: f.areaHectareas, latitud: f.latitud, longitud: f.longitud, porcentajeAporte: pct, kgAportados: kg, municipio: prod.municipio, departamento: prod.departamento }
      })
      const sumaPorcentaje = origen.reduce((a, o) => a + o.porcentajeAporte, 0)
      const sumaKg = origen.reduce((a, o) => a + o.kgAportados, 0)
      return { codigoLote: l.codigoLote, producto: p.nombreComercial, codigoHs: p.codigoHs, pesoNetoKg: l.pesoNetoKg, estadoLote: l.estadoLote, sumaPorcentaje, sumaKg, completa: Math.abs(sumaPorcentaje - 100) < 0.01 && Math.abs(sumaKg - l.pesoNetoKg) <= l.pesoNetoKg * 0.005, origen }
    }
  }

  if (camino === '/api/paises') {
    const ue = new URLSearchParams(consulta).get('ue')
    return PAISES.filter((p) => ue === null || String(p.perteneceUe) === ue)
  }

  if (camino === '/api/clientes' && metodo === 'GET') {
    const q = new URLSearchParams(consulta)
    const razon = q.get('razonSocial')?.toLowerCase()
    return CLIENTES.filter((c) =>
      (!q.get('idPais') || c.idPais === Number(q.get('idPais'))) &&
      (!q.get('estado') || c.estado === q.get('estado')) &&
      (!razon || c.razonSocial.toLowerCase().includes(razon)),
    ).sort((a, b) => a.razonSocial.localeCompare(b.razonSocial))
  }
  if (camino === '/api/clientes' && metodo === 'POST') return guardarClienteDemo(null, cuerpo)
  const cliente = camino.match(/^\/api\/clientes\/(\d+)$/)
  if (cliente && metodo === 'PUT') return guardarClienteDemo(Number(cliente[1]), cuerpo)

  if (camino === '/api/envios') {
    const estado = new URLSearchParams(consulta).get('estado')
    return ENVIOS.map((e) => e.envio).filter((e) => !estado || e.estadoEnvio === estado)
  }

  const evento = camino.match(/^\/api\/envios\/(\d+)\/seguimiento$/)
  if (evento && metodo === 'POST') {
    const encontrado = ENVIOS.find((e) => e.envio.idEnvio === Number(evento[1]))
    if (!encontrado) throw Object.assign(new Error('El envio no existe.'), { estado: 404, campos: {} })
    if (encontrado.envio.estadoEnvio === 'ENTREGADO') {
      throw Object.assign(new Error('El envio ya fue entregado; no admite mas eventos.'), { estado: 400, campos: {} })
    }
    const siguienteId = Math.max(...ENVIOS.flatMap((e) => e.seguimiento.map((s) => s.idSeguimiento))) + 1
    encontrado.seguimiento.push({
      idSeguimiento: siguienteId,
      fechaEvento: cuerpo.fechaEvento ?? new Date().toISOString().slice(0, 19),
      ubicacion: cuerpo.ubicacion,
      estado: cuerpo.estado,
      observacion: cuerpo.observacion ?? null,
    })
    encontrado.seguimiento.sort((a, b) => a.fechaEvento.localeCompare(b.fechaEvento))
    encontrado.envio.estadoEnvio = cuerpo.estado
    // Igual que el backend: EN_TRANSITO y ENTREGADO avanzan la orden.
    const o = ORDENES.find((x) => x.idOrden === encontrado.envio.idOrden)
    if (o && cuerpo.estado === 'EN_TRANSITO' && o.estadoOrden === 'CONFIRMADA') {
      o.estadoOrden = 'EN_TRANSITO'
      ORDENES_LOTES.filter((a) => a.idOrden === o.idOrden).forEach((a) => { LOTES.find((l) => l.idLote === a.idLote).estadoLote = 'EXPORTADO' })
    }
    if (o && cuerpo.estado === 'ENTREGADO') o.estadoOrden = 'ENTREGADA'
    return encontrado
  }

  const detalle = camino.match(/^\/api\/envios\/(\d+)$/)
  if (detalle) {
    const encontrado = ENVIOS.find((e) => e.envio.idEnvio === Number(detalle[1]))
    if (!encontrado) throw Object.assign(new Error('El envio no existe.'), { estado: 404, campos: {} })
    return encontrado
  }

  throw Object.assign(new Error('Esta opción no está disponible en el modo demo.'), { estado: 404, campos: {} })
}

// Validaciones iniciales de los lotes que ya pasaron por calidad.
LOTES.filter((l) => ['APROBADO', 'ASIGNADO', 'EXPORTADO'].includes(l.estadoLote)).forEach(validarLoteDemo)
