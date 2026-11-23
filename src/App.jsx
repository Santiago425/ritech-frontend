import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSesion } from './auth/SesionContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Inicio from './pages/Inicio.jsx'
import NoEncontrado from './pages/NoEncontrado.jsx'

// Cada módulo se descarga solo cuando el usuario entra a él (code splitting).
const Envios = lazy(() => import('./pages/Envios.jsx'))
const EnvioDetalle = lazy(() => import('./pages/EnvioDetalle.jsx'))
const Clientes = lazy(() => import('./pages/Clientes.jsx'))
const Productores = lazy(() => import('./pages/Productores.jsx'))
const ProductorDetalle = lazy(() => import('./pages/ProductorDetalle.jsx'))
const Lotes = lazy(() => import('./pages/Lotes.jsx'))
const LoteDetalle = lazy(() => import('./pages/LoteDetalle.jsx'))
const Usuarios = lazy(() => import('./pages/Usuarios.jsx'))
const Reportes = lazy(() => import('./pages/Reportes.jsx'))
const Productos = lazy(() => import('./pages/Productos.jsx'))
const Cumplimiento = lazy(() => import('./pages/Cumplimiento.jsx'))
const Ordenes = lazy(() => import('./pages/Ordenes.jsx'))
const OrdenDetalle = lazy(() => import('./pages/OrdenDetalle.jsx'))
const Auditoria = lazy(() => import('./pages/Auditoria.jsx'))

function Protegida({ children, permitido = true }) {
  const { usuario } = useSesion()
  if (!usuario) return <Navigate to="/login" replace />
  if (!permitido) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { usuario, puedeVerEnvios, tienePermiso } = useSesion()
  // GET /api/productores: hasAnyAuthority('PRODUCTORES_GESTIONAR','LOTES_TRAZABILIDAD')
  const puedeVerCumplimiento = ['CERTIFICADOS_CARGAR', 'ORDENES_GESTIONAR', 'REGLAS_ADMINISTRAR', 'VALIDACION_EJECUTAR'].some(tienePermiso)
  const puedeVerProductores = tienePermiso('PRODUCTORES_GESTIONAR') || tienePermiso('LOTES_TRAZABILIDAD')

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route index element={<Inicio />} />
        <Route path="envios" element={<Protegida permitido={puedeVerEnvios}><Envios /></Protegida>} />
        <Route path="envios/:id" element={<Protegida permitido={puedeVerEnvios}><EnvioDetalle /></Protegida>} />
        <Route path="clientes" element={<Protegida permitido={tienePermiso('CLIENTES_CONSULTAR')}><Clientes /></Protegida>} />
        <Route path="productores" element={<Protegida permitido={puedeVerProductores}><Productores /></Protegida>} />
        <Route path="productores/:id" element={<Protegida permitido={puedeVerProductores}><ProductorDetalle /></Protegida>} />
        <Route path="lotes" element={<Protegida permitido={tienePermiso('LOTES_CONSULTAR')}><Lotes /></Protegida>} />
        <Route path="lotes/:id" element={<Protegida permitido={tienePermiso('LOTES_CONSULTAR')}><LoteDetalle /></Protegida>} />
        <Route path="ordenes" element={<Protegida permitido={puedeVerEnvios}><Ordenes /></Protegida>} />
        <Route path="ordenes/:id" element={<Protegida permitido={puedeVerEnvios}><OrdenDetalle /></Protegida>} />
        <Route path="cumplimiento" element={<Protegida permitido={puedeVerCumplimiento}><Cumplimiento /></Protegida>} />
        <Route path="productos" element={<Protegida permitido={tienePermiso('PRODUCTOS_GESTIONAR')}><Productos /></Protegida>} />
        <Route path="reportes" element={<Protegida permitido={tienePermiso('ORDENES_GESTIONAR') || tienePermiso('AUDITORIA_CONSULTAR')}><Reportes /></Protegida>} />
        <Route path="usuarios" element={<Protegida permitido={tienePermiso('USUARIOS_GESTIONAR')}><Usuarios /></Protegida>} />
        <Route path="auditoria" element={<Protegida permitido={tienePermiso('AUDITORIA_CONSULTAR')}><Auditoria /></Protegida>} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  )
}
