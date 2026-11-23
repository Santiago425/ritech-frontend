const unsplash = (id) => (ancho = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${ancho}&q=70`

export const FOTOS = {
  cafetal: unsplash('1559556064-4161b6be179b'),
  cerezas: unsplash('1672851613221-c56f31efce8c'),
  rama: unsplash('1576758597367-2840b9dc1a2b'),
  cacao: unsplash('1720170723453-dd9de7397bd7'),
  granos: unsplash('1551610290-e153ec567dd8'),
  granosClaros: unsplash('1573883841850-49e42245e193'),
  saco: unsplash('1633627346972-0f3dfa551171'),
  tostado: unsplash('1633627351427-361201674337'),
  tostadora: unsplash('1561986810-4f3ba2f46ceb'),
  contenedores: unsplash('1635851801927-44c4d1c555af'),
  puerto: unsplash('1708354494203-ee87f42dbcbf'),
}

export const FOTO_POR_MODULO = {
  envios: 'contenedores',
  productores: 'cafetal',
  lotes: 'saco',
  cumplimiento: 'rama',
  ordenes: 'granosClaros',
  clientes: 'puerto',
  productos: 'cacao',
  reportes: 'tostadora',
}

export const RECORRIDO = [
  { foto: 'cafetal', titulo: 'Cultivo', texto: 'Fincas geolocalizadas en las montañas de Colombia.' },
  { foto: 'cerezas', titulo: 'Cosecha', texto: 'Cerezas de café y mazorcas de cacao en su punto.' },
  { foto: 'saco', titulo: 'Lotes', texto: 'Inspección de calidad y trazabilidad por finca.' },
  { foto: 'contenedores', titulo: 'Exportación', texto: 'Del puerto colombiano al importador europeo.' },
]
