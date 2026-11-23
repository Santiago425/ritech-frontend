import clientes from './assets/ilustraciones/clientes.svg'
import cumplimiento from './assets/ilustraciones/cumplimiento.svg'
import envios from './assets/ilustraciones/envios.svg'
import lotes from './assets/ilustraciones/lotes.svg'
import ordenes from './assets/ilustraciones/ordenes.svg'
import productores from './assets/ilustraciones/productores.svg'
import productos from './assets/ilustraciones/productos.svg'
import reportes from './assets/ilustraciones/reportes.svg'
import granoCafe from './assets/ilustraciones/grano-cafe.svg'
import mazorcaCacao from './assets/ilustraciones/mazorca-cacao.svg'

export const ILUSTRACIONES = { clientes, cumplimiento, envios, lotes, ordenes, productores, productos, reportes }

export const ILUSTRACION_POR_ICONO = {
  barco: 'envios',
  contenedor: 'lotes',
  documento: 'ordenes',
  hoja: 'productores',
  usuarios: 'clientes',
  cafe: 'productos',
  escudo: 'cumplimiento',
  grafica: 'reportes',
}

export const MINIATURAS = { cafe: granoCafe, cacao: mazorcaCacao }
